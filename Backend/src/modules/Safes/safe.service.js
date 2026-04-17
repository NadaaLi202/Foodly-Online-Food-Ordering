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
                const mongoose = (await import("mongoose")).default;
                match.companyId = new mongoose.Types.ObjectId(match.companyId);
            } catch (e) { }
        } else if (!match.companyId) {
            delete match.companyId;
        }

        // If safe is linked to an accounting account, use the ledger balance (Source of truth)
        if (safe.journalAccount) {
            const { dailyRestrictionModel } = await import("../dailyRestrictions/dailyRestrictions.model.js");
            const targetAccountId = safe.journalAccount._id?.toString() || safe.journalAccount.toString();
            const category = (safe.journalAccount.accountCategory || 'asset').toLowerCase();

            // Sum all debits and credits for this account ID
            const restrictions = await dailyRestrictionModel.find({ ...match }).select("entries").lean();
            let totalDebit = 0;
            let totalCredit = 0;

            for (const res of restrictions) {
                for (const entry of res.entries || []) {
                    const entryAccountId = entry.account?._id?.toString() || entry.account?.toString();
                    if (entryAccountId === targetAccountId) {
                        totalDebit += Number(entry.debit || 0);
                        totalCredit += Number(entry.credit || 0);
                    }
                }
            }

            // Asset/Expense/Income Net Balance logic:
            // Safes are Assets -> Balance = Debit - Credit
            if (['asset', 'income', 'expense'].includes(category)) {
                return totalDebit - totalCredit;
            } else {
                // Liability/Equity -> Balance = Credit - Debit
                return totalCredit - totalDebit;
            }
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
