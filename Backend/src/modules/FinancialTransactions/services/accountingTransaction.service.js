import AccountingTransaction from "../models/accountingTransaction.model.js";

export const createTransactionFromInvoice = async (invoice) => {
    try {
        if (!invoice) return;

        let type = null;
        if (invoice.paidAmount >= invoice.totalAmount && invoice.totalAmount > 0) {
            type = 'Income';
        } else if (invoice.status === 'paid') {
            type = 'Income';
        }

        if (!type) {
            // Unpaid invoice -> Remove any synced generic transaction and abort creation
            await AccountingTransaction.findOneAndDelete({ invoiceId: invoice._id });
            return;
        }

        let accountName = invoice.contactName || 'Unknown';
        if (invoice.contact && typeof invoice.contact === 'object') {
            accountName = invoice.contact.name || accountName;
        } else if (invoice.contactSnapshot && invoice.contactSnapshot.name) {
            accountName = invoice.contactSnapshot.name;
        }

        await AccountingTransaction.findOneAndUpdate(
            { invoiceId: invoice._id },
            {
                type,
                amount: invoice.totalAmount,
                account: accountName,
                date: invoice.issueDate || new Date(),
                referenceCode: invoice.transactionNumber || invoice.invoiceNumber,
                status: 'completed',
                companyId: invoice.companyId
            },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error("Failed to create transaction from invoice:", err);
    }
};
