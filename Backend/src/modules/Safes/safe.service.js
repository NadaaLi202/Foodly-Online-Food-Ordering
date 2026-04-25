import mongoose from "mongoose";
import { safeModel } from "./safe.model.js";
import { branchModel } from "../branch/branch.model.js";
import FinancialReceipt from "../FinancialTransactions/models/financialReceipt.model.js";
import FinancialDisbursement from "../FinancialTransactions/models/financialDisbursement.model.js";
import FinancialTransfer from "../FinancialTransactions/models/financialTransfer.model.js";
import AccountingTransaction from "../FinancialTransactions/models/accountingTransaction.model.js";

export const seedDefaultSafe = async (companyId) => {
    try {
        // Check if main safe already exists
        const existingMainSafe = await safeModel.findOne({ companyId, isDefault: true });
        if (existingMainSafe) return true;

        // Find the main branch to link the safe to
        const mainBranch = await branchModel.findOne({ companyId, is_main: true });

        // Find the linked accounting account (code 1211 - الخزنة الرئيسية)
        const { chartOfAccountsModel } = await import("../chartOfAccounts/chartOfAccounts.model.js");
        const journalAccount = await chartOfAccountsModel.findOne({ companyId, code: "1211" });

        await safeModel.create({
            companyId,
            name: "الخزنة الرئيسية",
            balance: 0,
            isDefault: true,
            branches: ["main"],
            enableReceiptPermissions: false,
            enablePaymentPermissions: false,
            accountNumber: "1211",
            journalAccount: journalAccount?._id || null
        });

        return true;
    } catch (error) {
        console.error(`Error seeding default safe for company ${companyId}:`, error);
        return false;
    }
};

/**
 * Calculate the dynamic balance of a safe from journal entries
 * @param {string} safeId - The safe ID
 * @param {object} companyFilter - Company filter object
 * @returns {number} The calculated balance
 */
export const calculateSafeBalance = async (safeId, companyFilter) => {
    try {
        const safe = await safeModel.findById(safeId).populate('journalAccount').lean();
        if (!safe) return 0;

        const match = { ...companyFilter };
        if (match.companyId && typeof match.companyId === 'string') {
            try {
                match.companyId = new mongoose.Types.ObjectId(match.companyId);
            } catch (e) { }
        } else if (!match.companyId) {
            delete match.companyId;
        }

        // If safe is linked to an accounting account, use the ledger balance (Source of truth)
        if (safe.journalAccount) {
            const { dailyRestrictionModel } = await import("../dailyRestrictions/dailyRestrictions.model.js");
            const targetAccountId = new mongoose.Types.ObjectId(safe.journalAccount._id?.toString() || safe.journalAccount.toString());
            const category = (safe.journalAccount.accountCategory || 'asset').toLowerCase();

            const result = await dailyRestrictionModel.aggregate([
                { $match: match },
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

            // Balance = Total Debit - Total Credit
            return totalDebit - totalCredit;
        }

        // Fallback to model-based calculation (Legacy / Unlinked)
        const [receipts, disbursements, transfersFrom, transfersTo, accIncomes, accExpenses] = await Promise.all([
            FinancialReceipt.find({ ...match, account: safeId, accountModel: 'Safe', deletedAt: { $in: [null, undefined] } }).lean(),
            FinancialDisbursement.find({ ...match, account: safeId, accountModel: 'Safe', deletedAt: { $in: [null, undefined] } }).lean(),
            FinancialTransfer.find({ ...match, fromAccount: safeId, fromAccountModel: 'Safe', deletedAt: { $in: [null, undefined] } }).lean(),
            FinancialTransfer.find({ ...match, toAccount: safeId, toAccountModel: 'Safe', deletedAt: { $in: [null, undefined] } }).lean(),
            AccountingTransaction.find({ ...match, safe: safeId, safeModel: 'Safe', type: 'Income', deletedAt: { $in: [null, undefined] } }).lean(),
            AccountingTransaction.find({ ...match, safe: safeId, safeModel: 'Safe', type: 'Expense', deletedAt: { $in: [null, undefined] } }).lean()
        ]);

        const receiptTotal = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        const disbursementTotal = disbursements.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const transferInTotal = transfersTo.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const transferOutTotal = transfersFrom.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const accInTotal = accIncomes.reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const accOutTotal = accExpenses.reduce((sum, a) => sum + Number(a.amount || 0), 0);

        return (receiptTotal + transferInTotal + accInTotal) - (disbursementTotal + transferOutTotal + accOutTotal);
    } catch (error) {
        console.error(`Error calculating balance for safe ${safeId}:`, error);
        return 0;
    }
};

/**
 * Migration function: Fixes unlinked safes by automatically linking them to the correct accounting account (1211).
 * Logic: Links any orphaned safe to the journal account with code 1211 (الخزنة الرئيسية) as a fallback.
 */
export const fixUnlinkedSafes = async () => {
    try {
        const { chartOfAccountsModel } = await import("../chartOfAccounts/chartOfAccounts.model.js");

        // Find all safes with missing journalAccount
        const unlinkedSafes = await safeModel.find({
            $or: [
                { journalAccount: null },
                { journalAccount: { $exists: false } }
            ]
        });

        if (unlinkedSafes.length === 0) return true;

        const { companyModel } = await import("../companies/company.model.js");
        const existingCompanies = await companyModel.find({}, '_id').lean();
        const companyIdSet = new Set(existingCompanies.map(c => c._id.toString()));

        for (const safe of unlinkedSafes) {
            const companyId = safe.companyId;
            if (!companyId || !companyIdSet.has(companyId.toString())) {
                continue; // Skip safes from non-existent companies
            }
            const companyOid = new mongoose.Types.ObjectId(companyId.toString());

            // Debug log requested by user
            try {
                const allAccounts = await chartOfAccountsModel.find({ companyId: companyOid }).lean();
                console.log('[Migration Debug] Total chart accounts found for safe migration:', allAccounts.length);
                console.log(`[Migration Debug] Looking for code 1211, companyId: ${companyOid}`);
                const found = allAccounts.filter(a => String(a.code) === '1211');
                console.log('[Migration Debug] Accounts with code 1211:', found);
            } catch (e) {
                console.error('[Migration Debug] Error running debug query:', e.message);
            }
            // Find journal account code 1211 (الخزنة الرئيسية)
            const journalAccount = await chartOfAccountsModel.findOne({
                companyId: companyOid,
                code: "1211"
            });

            if (journalAccount) {
                safe.journalAccount = journalAccount._id;
                await safe.save();
                console.log(`[Migration] Auto-linked safe "${safe.name}" to journal account "${journalAccount.name}" (#${journalAccount.code})`);
            } else {
                console.warn(`[Migration] Could not find journal account 1211 for safe "${safe.name}"`);
            }
        }

        return true;
    } catch (error) {
        console.error("Error fixing unlinked safes:", error);
        return false;
    }
};
