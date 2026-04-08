import { safeModel } from "./safe.model.js";
import { branchModel } from "../branch/branch.model.js";
import FinancialReceipt from "../FinancialTransactions/models/financialReceipt.model.js";
import FinancialDisbursement from "../FinancialTransactions/models/financialDisbursement.model.js";
import FinancialTransfer from "../FinancialTransactions/models/financialTransfer.model.js";

export const seedDefaultSafe = async (companyId) => {
    try {
        // Check if main safe already exists
        const existingMainSafe = await safeModel.findOne({ companyId, isDefault: true });
        if (existingMainSafe) return true;

        // Find the main branch to link the safe to
        const mainBranch = await branchModel.findOne({ companyId, is_main: true });

        await safeModel.create({
            companyId,
            name: "الخزنة الرئيسية",
            balance: 0,
            isDefault: true,
            branches: ["main"],
            enableReceiptPermissions: false,
            enablePaymentPermissions: false
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
        const match = { ...companyFilter };
        if (!match.companyId) delete match.companyId;

        const [receipts, disbursements, transfersFrom, transfersTo] = await Promise.all([
            FinancialReceipt.find({ ...match, account: safeId, accountModel: 'Safe', deletedAt: { $in: [null, undefined] } }).lean(),
            FinancialDisbursement.find({ ...match, account: safeId, accountModel: 'Safe', deletedAt: { $in: [null, undefined] } }).lean(),
            FinancialTransfer.find({ ...match, fromAccount: safeId, fromAccountModel: 'Safe', deletedAt: { $in: [null, undefined] } }).lean(),
            FinancialTransfer.find({ ...match, toAccount: safeId, toAccountModel: 'Safe', deletedAt: { $in: [null, undefined] } }).lean()
        ]);

        const receiptTotal = receipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);
        const disbursementTotal = disbursements.reduce((sum, disbursement) => sum + Number(disbursement.amount || 0), 0);
        const transferInTotal = transfersTo.reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0);
        const transferOutTotal = transfersFrom.reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0);

        return receiptTotal + transferInTotal - disbursementTotal - transferOutTotal;
    } catch (error) {
        console.error(`Error calculating balance for safe ${safeId}:`, error);
        return 0;
    }
};
