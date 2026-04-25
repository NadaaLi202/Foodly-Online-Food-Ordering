import { bankAccountModel } from "./bankAccount.model.js";
import mongoose from "mongoose";

export const seedDefaultBankAccount = async (companyId) => {
    try {
        // Check if the default bank account already exists for this company
        const existingBankAccount = await bankAccountModel.findOne({ companyId, name: "الحساب البنكي الرئيسي" });
        if (existingBankAccount) return true;

        // Find the linked accounting account (code 1221 - الحساب البنكي الرئيسي)
        const { chartOfAccountsModel } = await import("../chartOfAccounts/chartOfAccounts.model.js");
        const companyOid = new mongoose.Types.ObjectId(companyId.toString());
        const journalAccount = await chartOfAccountsModel.findOne({ companyId: companyOid, code: "1221" });

        await bankAccountModel.create({
            companyId,
            name: "الحساب البنكي الرئيسي",
            balance: 0,
            accountNumber: "1221",
            journalAccount: journalAccount?._id || null,
            branches: ["main"],
            enableReceiptPermissions: false,
            enablePaymentPermissions: false,
            custodians: [],
            users: []
        });

        return true;
    } catch (error) {
        console.error(`Error seeding default bank account for company ${companyId}:`, error);
        return false;
    }
};

/**
 * Calculate the dynamic balance of a bank account from ALL transaction sources.
 * Sources: DailyRestrictions, FinancialReceipts, FinancialDisbursements,
 *          FinancialTransfers, AccountingTransactions, Payments
 * @param {string} bankAccountId - The bank account ID
 * @param {object} companyFilter - Company filter object
 * @returns {number} The calculated balance
 */
export const calculateBankAccountBalance = async (bankAccountId, companyFilter) => {
    try {
        const bankAccount = await bankAccountModel.findById(bankAccountId).lean();
        if (!bankAccount) return 0;

        const TAG = `[BankBalance][${bankAccount.name}]`;
        const companyId = companyFilter?.companyId || bankAccount.companyId;
        let companyOid;
        try {
            companyOid = new mongoose.Types.ObjectId(companyId.toString());
        } catch (e) {
            companyOid = companyId;
        }

        const bankAccountOid = new mongoose.Types.ObjectId(bankAccountId.toString());
        const bankAccountStr = bankAccountId.toString();
        let balance = 0;

        console.log(`${TAG} Calculating balance for bankAccountId=${bankAccountStr}, companyId=${companyOid}`);

        // ─── Source 1: Journal Entries (DailyRestrictions) ───
        try {
            const { dailyRestrictionModel } = await import("../dailyRestrictions/dailyRestrictions.model.js");

            if (bankAccount.journalAccount) {
                let targetAccountId;
                try {
                    const rawId = bankAccount.journalAccount._id || bankAccount.journalAccount;
                    targetAccountId = new mongoose.Types.ObjectId(rawId.toString());
                } catch (e) {
                    targetAccountId = null;
                }

                if (targetAccountId) {
                    const result = await dailyRestrictionModel.aggregate([
                        { $match: { companyId: companyOid } },
                        { $unwind: "$entries" },
                        { $match: { "entries.account": targetAccountId } },
                        {
                            $group: {
                                _id: null,
                                totalDebit: { $sum: "$entries.debit" },
                                totalCredit: { $sum: "$entries.credit" }
                            }
                        }
                    ]);

                    const { totalDebit = 0, totalCredit = 0 } = result[0] || {};
                    if (totalDebit > 0 || totalCredit > 0) {
                        const ledgerBalance = totalDebit - totalCredit;
                        console.log(`${TAG} Journal entries (linked): debit=${totalDebit}, credit=${totalCredit}, balance=${ledgerBalance}`);
                        return ledgerBalance;
                    }
                }
            }
        } catch (e) {
            console.error(`${TAG} Error querying journal entries:`, e.message);
        }

        // ─── Source 2: FinancialReceipts (money IN) ───
        try {
            const FinancialReceipt = (await import("../FinancialTransactions/models/financialReceipt.model.js")).default;
            const receipts = await FinancialReceipt.aggregate([
                {
                    $match: {
                        companyId: companyOid,
                        account: bankAccountOid,
                        accountModel: 'BankAccount',
                        deletedAt: { $exists: false }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const receiptTotal = receipts[0]?.total || 0;
            balance += receiptTotal;
            console.log(`${TAG} FinancialReceipts IN: ${receiptTotal}`);
        } catch (e) {
            console.error(`${TAG} Error querying FinancialReceipts:`, e.message);
        }

        // ─── Source 3: FinancialDisbursements (money OUT) ───
        try {
            const FinancialDisbursement = (await import("../FinancialTransactions/models/financialDisbursement.model.js")).default;
            const disbursements = await FinancialDisbursement.aggregate([
                {
                    $match: {
                        companyId: companyOid,
                        account: bankAccountOid,
                        accountModel: 'BankAccount',
                        deletedAt: { $exists: false }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const disbTotal = disbursements[0]?.total || 0;
            balance -= disbTotal;
            console.log(`${TAG} FinancialDisbursements OUT: ${disbTotal}`);
        } catch (e) {
            console.error(`${TAG} Error querying FinancialDisbursements:`, e.message);
        }

        // ─── Source 4: FinancialTransfers ───
        try {
            const FinancialTransfer = (await import("../FinancialTransactions/models/financialTransfer.model.js")).default;
            const transfersIn = await FinancialTransfer.aggregate([
                {
                    $match: {
                        companyId: companyOid,
                        toAccount: bankAccountOid,
                        toAccountModel: 'BankAccount',
                        deletedAt: { $exists: false }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            balance += transfersIn[0]?.total || 0;

            const transfersOut = await FinancialTransfer.aggregate([
                {
                    $match: {
                        companyId: companyOid,
                        fromAccount: bankAccountOid,
                        fromAccountModel: 'BankAccount',
                        deletedAt: { $exists: false }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            balance -= transfersOut[0]?.total || 0;
        } catch (e) {
            console.error(`${TAG} Error querying FinancialTransfers:`, e.message);
        }

        // ─── Source 5: AccountingTransactions ───
        try {
            const AccountingTransaction = (await import("../FinancialTransactions/models/accountingTransaction.model.js")).default;
            const acctMatch = {
                companyId: companyOid,
                $or: [
                    { bankAccount: bankAccountOid },
                    { safe: bankAccountOid, safeModel: 'BankAccount' }
                ],
                deletedAt: null
            };
            const acctIn = await AccountingTransaction.aggregate([
                { $match: { ...acctMatch, type: { $in: ['Income', 'Receivable'] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const acctOut = await AccountingTransaction.aggregate([
                { $match: { ...acctMatch, type: { $in: ['Expense', 'Payable'] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            if (balance === 0) {
                balance += acctIn[0]?.total || 0;
                balance -= acctOut[0]?.total || 0;
            }
        } catch (e) {
            console.error(`${TAG} Error querying AccountingTransactions:`, e.message);
        }

        // ─── Source 6: Payments ───
        try {
            const Payment = (await import("../payments/payments.model.js")).default;
            const treasuryMatch = { $in: [bankAccountStr, bankAccountOid] };
            const results = await Payment.aggregate([
                {
                    $match: {
                        companyId: companyOid,
                        treasury: treasuryMatch,
                        treasuryType: 'bank',
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: "$operationType",
                        total: { $sum: "$amount" }
                    }
                }
            ]);
            if (balance === 0) {
                results.forEach(r => {
                    if (r._id === 'receive') balance += r.total;
                    if (r._id === 'spend') balance -= r.total;
                });
            }
        } catch (e) {
            console.error(`${TAG} Error querying Payments:`, e.message);
        }

        console.log(`${TAG} FINAL balance: ${balance}`);
        return balance;
    } catch (error) {
        console.error(`Error calculating balance for bank account ${bankAccountId}:`, error);
        return 0;
    }
};

/**
 * Migration function: Converts legacy payments with treasury="main" to use the default safe.
 */
export const migrateLegacyPayments = async () => {
    try {
        const Payment = (await import("../payments/payments.model.js")).default;
        const { safeModel } = await import("../Safes/safe.model.js");

        console.log("[Migration] Starting legacy payments migration...");
        const companies = await Payment.distinct('companyId');

        for (const companyId of companies) {
            let defaultSafe = await safeModel.findOne({ companyId, isDefault: true }).lean();
            if (!defaultSafe) defaultSafe = await safeModel.findOne({ companyId }).lean();

            if (defaultSafe) {
                await Payment.updateMany(
                    { companyId, treasury: 'main' },
                    { treasury: defaultSafe._id.toString(), treasuryType: 'safe' }
                );
            }

            await Payment.updateMany(
                {
                    companyId,
                    treasury: { $ne: 'main', $regex: /^[0-9a-fA-F]{24}$/ },
                    treasuryType: { $exists: false }
                },
                { treasuryType: 'bank' }
            );
        }

        console.log("[Migration] Legacy payments migration completed.");
        return { success: true };
    } catch (e) {
        console.error("[Migration] Error migrating legacy payments:", e.message);
        return { success: false, error: e.message };
    }
};

/**
 * Migration function: Fixes unlinked bank accounts by automatically linking them to the correct accounting account.
 */
export const fixPrimaryBankAccounts = async () => {
    try {
        const { chartOfAccountsModel } = await import("../chartOfAccounts/chartOfAccounts.model.js");
        const { companyModel } = await import("../companies/company.model.js");

        const unlinkedAccounts = await bankAccountModel.find({
            $or: [
                { journalAccount: { $exists: false } },
                { journalAccount: null }
            ]
        });

        if (unlinkedAccounts.length === 0) {
            console.log(`[Migration] All bank accounts already have journalAccount linked.`);
            return true;
        }

        const existingCompanies = await companyModel.find({}, '_id').lean();
        const companyIdSet = new Set(existingCompanies.map(c => c._id.toString()));

        console.log(`[Migration] Found ${unlinkedAccounts.length} unlinked bank accounts. Linking to code 1221...`);

        for (const bankAccount of unlinkedAccounts) {
            const companyId = bankAccount.companyId;
            if (!companyId || !companyIdSet.has(companyId.toString())) continue;
            
            const companyOid = new mongoose.Types.ObjectId(companyId.toString());
            const chartAccount = await chartOfAccountsModel.findOne({
                companyId: companyOid,
                code: "1221"
            });

            if (chartAccount) {
                bankAccount.journalAccount = chartAccount._id;
                await bankAccount.save();

                // STEP 3 - Verification log
                console.log('[FIX] Bank account linked to journal account:', {
                    bankAccountName: bankAccount.name,
                    journalAccountCode: chartAccount.code,
                    journalAccountId: chartAccount._id
                });
                console.log(`[FIXED] Bank account "${bankAccount.name}" successfully linked.`);
            } else {
                console.warn(`[Migration] Could not find Chart of Accounts code 1221 for company ${companyId}. Skipping link for "${bankAccount.name}"`);
            }
        }
        
        console.log(`[Migration] Bank account linking complete.`);
        return true;
    } catch (error) {
        console.error("Error fixing unlinked bank accounts:", error);
        return false;
    }
};
