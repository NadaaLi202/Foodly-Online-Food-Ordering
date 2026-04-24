import mongoose from "mongoose";
import AccountingTransaction from "../models/accountingtransaction.model.js";
import { safeModel } from "../../safes/safe.model.js";
import { bankAccountModel } from "../../bankaccounts/bankaccount.model.js";
import { dailyRestrictionModel } from "../../dailyrestrictions/dailyrestrictions.model.js";
import { generateJournalEntryNumber, findAccount } from "../../transaction/transaction.accounting.js";

export const createTransactionFromInvoice = async (invoice, treasuryData = null) => {
    try {
        if (!invoice) return;

        const isSales = invoice.module === 'sales';
        // ALWAYS treat the invoice record as Receivable/Payable to represent the debt/sale
        const type = isSales ? 'Receivable' : 'Payable';

        // If it's a draft, logic might differ but usually we only sync issued invoices
        if (invoice.status === 'draft') {
            await AccountingTransaction.findOneAndDelete({ invoiceId: invoice._id, paymentId: null });
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
            const { treasuryId, treasuryType } = treasuryData;
            console.log(`[Accounting] Resolving treasury for invoice ${invoice.transactionNumber}: type=${treasuryType}, id=${treasuryId}`);

            if (mongoose.Types.ObjectId.isValid(treasuryId)) {
                if (treasuryType === 'bank') {
                    updateData.bankAccount = treasuryId;
                    updateData.safe = null;
                    updateData.safeModel = 'BankAccount';
                    console.log(`[Accounting] Assigned bankAccount: ${treasuryId}`);
                } else {
                    updateData.safe = treasuryId;
                    updateData.bankAccount = null;
                    updateData.safeModel = 'Safe';
                    console.log(`[Accounting] Assigned safe: ${treasuryId}`);
                }
            } else {
                console.warn(`[Accounting] Skipping invalid treasury ID "${treasuryId}" for invoice ${invoice.transactionNumber}`);
            }
        }

        await AccountingTransaction.findOneAndUpdate(
            { invoiceId: invoice._id, paymentId: null },
            updateData,
            { upsert: true, new: true }
        );

        // CREATE JOURNAL ENTRY FOR BANK PAYMENTS
        let paymentEntryId = null;
        if (treasuryData && treasuryData.treasuryType === 'bank' && mongoose.Types.ObjectId.isValid(treasuryData.treasuryId)) {
            const bankAcc = await bankAccountModel.findById(treasuryData.treasuryId).lean();
            const journalAccountId = bankAcc?.journalAccount?._id?.toString() || bankAcc?.journalAccount?.toString();

            if (journalAccountId) {
                console.log(`[Accounting] Creating bank journal entry for invoice ${invoice.transactionNumber}`);
                const companyId = invoice.companyId;
                const entryDate = invoice.issueDate || new Date();
                
                // Fetch AR/AP account
                const partyAccount = isSales
                    ? await findAccount(companyId, ['126', '121', '12'], ['عملاء', 'مدينون', 'Customers', 'Receivable'])
                    : await findAccount(companyId, ['212', '21'], ['موردون', 'دائنون', 'Suppliers', 'Payable']);

                if (partyAccount && journalAccountId) {
                    const entries = [];
                    const amount = Number(invoice.totalAmount || 0);

                    if (isSales) {
                        // Debit: Bank, Credit: AR
                        entries.push({ account: journalAccountId, description: `تحصيل فاتورة مبيعات ${invoice.transactionNumber} - ${bankAcc.name}`, debit: amount, credit: 0 });
                        entries.push({ account: partyAccount, description: `سداد فاتورة مبيعات ${invoice.transactionNumber} (بنك)`, debit: 0, credit: amount });
                    } else {
                        // Debit: AP, Credit: Bank
                        entries.push({ account: partyAccount, description: `سداد فاتورة مشتريات ${invoice.transactionNumber} (بنك)`, debit: amount, credit: 0 });
                        entries.push({ account: journalAccountId, description: `صرف فاتورة مشتريات ${invoice.transactionNumber} - ${bankAcc.name}`, debit: 0, credit: amount });
                    }

                    const number = await generateJournalEntryNumber(companyId, entryDate);
                    const restriction = await dailyRestrictionModel.create({
                        number,
                        date: entryDate,
                        description: `قيد سداد آلي (بنكي) - فاتورة ${invoice.transactionNumber}`,
                        source: invoice.transactionNumber,
                        totalDebit: amount,
                        totalCredit: amount,
                        entries,
                        companyId,
                        invoiceId: invoice._id,
                        sourceType: 'payment'
                    });
                    console.log(`[Accounting] Bank journal entry created: ${restriction.number}`);
                    paymentEntryId = restriction._id;
                } else {
                    console.warn(`[Accounting] Could not resolve accounts for bank journal entry [Bank: ${!!journalAccountId}, Party: ${!!partyAccount}]`);
                }
            } else {
                console.warn(`[Accounting] CRITICAL: Bank account ${treasuryData.treasuryId} has no linked journalAccount. Skipping journal entry.`);
            }
        }
        return paymentEntryId;
    } catch (err) {
        console.error("Failed to create transaction from invoice:", err);
        return null;
    }
};

export const createTransactionFromPayment = async (payment, invoice) => {
    try {
        if (!payment || !invoice) return;

        const isSales = invoice.module === 'sales';
        const type = isSales ? 'Income' : 'Expense';

        let accountName = invoice.contactName || 'Unknown';
        if (invoice.contact && typeof invoice.contact === 'object') {
            accountName = invoice.contact.name || accountName;
        } else if (invoice.contactSnapshot && invoice.contactSnapshot.name) {
            accountName = invoice.contactSnapshot.name;
        }

        let treasuryId = payment.treasury;
        let treasuryType = payment.treasuryType;

        console.log(`[Accounting] Payment ${payment.referenceNumber}: type=${treasuryType}, id=${treasuryId}`);

        // Validation: Do not use any fallback. Throw error if invalid.
        if (!mongoose.Types.ObjectId.isValid(treasuryId)) {
            console.error(`[Accounting] REJECTED: Invalid treasury ID "${treasuryId}" for payment ${payment._id}`);
            return; // Skip creation to avoid CastError
        }

        const updateData = {
            type,
            amount: payment.amount,
            account: accountName,
            date: payment.date || new Date(),
            referenceCode: isSales ? `عملية دفع عميل #${invoice.transactionNumber}` : `عملية دفع مورد #${invoice.transactionNumber}`,
            description: `سداد فاتورة ${invoice.transactionNumber}`,
            status: 'completed',
            companyId: invoice.companyId,
            invoiceId: invoice._id,
            paymentId: payment._id,
            safeModel: treasuryType === 'bank' ? 'BankAccount' : 'Safe'
        };

        if (treasuryType === 'bank') {
            updateData.bankAccount = treasuryId;
            updateData.safe = null; // Ensure the other field is cleared
            console.log(`[Accounting] Assigned bankAccount: ${treasuryId}`);
        } else {
            updateData.safe = treasuryId;
            updateData.bankAccount = null;
            console.log(`[Accounting] Assigned safe: ${treasuryId}`);
        }

        await AccountingTransaction.findOneAndUpdate(
            { paymentId: payment._id },
            updateData,
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error("Failed to create transaction from payment:", err);
    }
};

export const deleteTransactionFromPayment = async (paymentId) => {
    try {
        if (!paymentId) return;
        await AccountingTransaction.findOneAndDelete({ paymentId });
    } catch (err) {
        console.error("Failed to delete transaction from payment:", err);
    }
};

export const deleteTransactionFromInvoice = async (invoiceId) => {
    try {
        if (!invoiceId) return;
        // Delete both the invoice record and all its payment records
        await AccountingTransaction.deleteMany({ invoiceId });
        console.log(`[Accounting] Auto-transactions for invoice ${invoiceId} deleted.`);
    } catch (err) {
        console.error("Failed to delete transaction from invoice:", err);
    }
};
