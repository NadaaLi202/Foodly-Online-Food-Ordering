import { bankAccountModel } from "./bankAccount.model.js";
import mongoose from "mongoose";

export const seedDefaultBankAccount = async (companyId) => {
    try {
        // Check if the default bank account already exists for this company
        const existingBankAccount = await bankAccountModel.findOne({ companyId, name: "الحساب البنكي الرئيسي" });
        if (existingBankAccount) return true;

        // Find the linked accounting account (code 1221 - الحساب البنكي الرئيسي)
        const { chartOfAccountsModel } = await import("../chartOfAccounts/chartOfAccounts.model.js");
        const journalAccount = await chartOfAccountsModel.findOne({ companyId, code: "1221" });

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
 * Calculate the dynamic balance of a bank account from journal entries
 * @param {string} bankAccountId - The bank account ID
 * @param {object} companyFilter - Company filter object
 * @returns {number} The calculated balance
 */
export const calculateBankAccountBalance = async (bankAccountId, companyFilter) => {
    try {
        const bankAccount = await bankAccountModel.findById(bankAccountId).populate('journalAccount').lean();
        if (!bankAccount) return 0;

        const match = { ...companyFilter };
        if (match.companyId && typeof match.companyId === 'string') {
            try {
                match.companyId = new mongoose.Types.ObjectId(match.companyId);
            } catch (e) { }
        }

        // If bank account is linked to an accounting account, use the ledger balance (Source of truth)
        if (bankAccount.journalAccount) {
            const { dailyRestrictionModel } = await import("../dailyRestrictions/dailyRestrictions.model.js");
            const targetAccountId = new mongoose.Types.ObjectId(bankAccount.journalAccount._id?.toString() || bankAccount.journalAccount.toString());
            const category = (bankAccount.journalAccount.accountCategory || 'asset').toLowerCase();

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

            // Bank Accounts are Assets -> Balance = Debit - Credit
            if (['asset', 'income', 'expense'].includes(category)) {
                return totalDebit - totalCredit;
            } else {
                return totalCredit - totalDebit;
            }
        }

        return Number(bankAccount.balance || 0);
    } catch (error) {
        console.error(`Error calculating balance for bank account ${bankAccountId}:`, error);
        return 0;
    }
};

/**
 * Migration function: Fixes unlinked bank accounts by automatically linking them to the correct accounting account.
 * Logic: Tries to find an account starting with 122 that matches the bank account name, 
 * otherwise falls back to the default bank account (code 1221).
 */
export const fixPrimaryBankAccounts = async () => {
    try {
        const { chartOfAccountsModel } = await import("../chartOfAccounts/chartOfAccounts.model.js");
        
        // Find all bank accounts with missing journalAccount
        const unlinkedAccounts = await bankAccountModel.find({
            $or: [
                { journalAccount: null },
                { journalAccount: { $exists: false } }
            ]
        });

        if (unlinkedAccounts.length === 0) return true;

        console.log(`[Migration] Checking ${unlinkedAccounts.length} unlinked bank accounts for automatic mapping...`);

        for (const account of unlinkedAccounts) {
            // 1. Try to find a chart of accounts entry with matching name in the bank category (122)
            let journalAccount = await chartOfAccountsModel.findOne({
                companyId: account.companyId,
                name: account.name,
                code: { $regex: /^122/ }
            });

            // 2. Fallback to default bank account (1221) if no specific match
            if (!journalAccount) {
                journalAccount = await chartOfAccountsModel.findOne({
                    companyId: account.companyId,
                    code: "1221"
                });
            }

            if (journalAccount) {
                account.journalAccount = journalAccount._id;
                await account.save();
                console.log(`[Migration] Auto-linked bank account "${account.name}" to journal account "${journalAccount.name}" (#${journalAccount.code})`);
            } else {
                console.warn(`[Migration] Could not find a suitable journal account for bank account "${account.name}"`);
            }
        }

        return true;
    } catch (error) {
        console.error("Error fixing unlinked bank accounts:", error);
        return false;
    }
};
