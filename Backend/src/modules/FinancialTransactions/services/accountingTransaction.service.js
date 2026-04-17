import AccountingTransaction from "../models/accountingTransaction.model.js";

export const createTransactionFromInvoice = async (invoice, treasuryData = null) => {
    try {
        if (!invoice) return;

        const isSales = invoice.module === 'sales';
        let type = null;
        
        if (invoice.paidAmount > 0) {
            type = isSales ? 'Income' : 'Expense';
        } else {
            type = isSales ? 'Receivable' : 'Payable';
        }

        // If it's a draft, logic might differ but usually we only sync issued invoices
        if (invoice.status === 'draft') {
            await AccountingTransaction.findOneAndDelete({ invoiceId: invoice._id });
            return;
        }

        let accountName = invoice.contactName || 'Unknown';
        if (invoice.contact && typeof invoice.contact === 'object') {
            accountName = invoice.contact.name || accountName;
        } else if (invoice.contactSnapshot && invoice.contactSnapshot.name) {
            accountName = invoice.contactSnapshot.name;
        }

        const updateData = {
            type,
            amount: invoice.totalAmount,
            account: accountName,
            date: invoice.issueDate || new Date(),
            referenceCode: invoice.transactionNumber || invoice.invoiceNumber,
            description: isSales ? `فاتورة مبيعات` : `فاتورة مشتريات`,
            status: 'completed',
            companyId: invoice.companyId,
            invoiceId: invoice._id
        };

        if (treasuryData) {
            updateData.safe = treasuryData.safeId;
            updateData.safeModel = treasuryData.safeModel || 'Safe';
        }

        await AccountingTransaction.findOneAndUpdate(
            { invoiceId: invoice._id },
            updateData,
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error("Failed to create transaction from invoice:", err);
    }
};
export const deleteTransactionFromInvoice = async (invoiceId) => {
    try {
        if (!invoiceId) return;
        await AccountingTransaction.findOneAndDelete({ invoiceId });
        console.log(`[Accounting] Auto-transaction for invoice ${invoiceId} deleted.`);
    } catch (err) {
        console.error("Failed to delete transaction from invoice:", err);
    }
};
