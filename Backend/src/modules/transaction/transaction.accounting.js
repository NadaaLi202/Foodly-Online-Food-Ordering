/**
 * transaction.accounting.js
 * 
 * Auto-creates journal entries (قيود يومية) when invoices are confirmed or paid.
 * Accounts are resolved dynamically from the company's chart of accounts.
 */

import { dailyRestrictionModel } from '../dailyRestrictions/dailyRestrictions.model.js';
import { chartOfAccountsModel } from '../chartOfAccounts/chartOfAccounts.model.js';
import mongoose from 'mongoose';
import logError from '../../utils/logError.js';

/**
 * Generate the next journal entry number for a given company.
 * Replicates the pre-save hook logic so we can supply the number explicitly,
 * avoiding the Mongoose validate-before-hook race condition.
 */
const generateJournalEntryNumber = async (companyId, date = new Date()) => {
    const d = new Date(date);
    const year = String(d.getFullYear()).slice(-2);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}-`;

    const lastEntry = await dailyRestrictionModel.findOne({
        companyId,
        number: new RegExp(`^${prefix}`)
    }).sort({ number: -1 }).lean();

    let nextSeq = 1;
    if (lastEntry?.number) {
        const parts = lastEntry.number.split('-');
        if (parts.length === 3) {
            const n = parseInt(parts[2]);
            if (!isNaN(n)) nextSeq = n + 1;
        }
    }

    let finalNumber = `${prefix}${String(nextSeq).padStart(6, '0')}`;

    // Concurrent request safety: if number already exists, find the next available one
    let exists = await dailyRestrictionModel.findOne({ number: finalNumber, companyId }).select('_id').lean();
    while (exists) {
        nextSeq++;
        finalNumber = `${prefix}${String(nextSeq).padStart(6, '0')}`;
        exists = await dailyRestrictionModel.findOne({ number: finalNumber, companyId }).select('_id').lean();
    }

    return finalNumber;
};


/**
 * Find an account in the company's chart by code prefix or name pattern.
 * Returns the account's ObjectId string (used as `account` field in entries), or null.
 */
const findAccount = async (companyId, codePatterns = [], namePatterns = []) => {
    try {
        const conditions = [];

        for (const code of codePatterns) {
            conditions.push({ code: { $regex: `^${code}`, $options: 'i' } });
        }
        for (const name of namePatterns) {
            conditions.push({ name: { $regex: name, $options: 'i' } });
        }

        if (conditions.length === 0) return null;

        const account = await chartOfAccountsModel.findOne({
            companyId,
            status: { $ne: 'inactive' },
            $or: conditions
        }).select('_id code name').lean();

        // Return the raw ObjectId string so the balance sheet matches properly
        return account ? account._id.toString() : null;
    } catch (err) {
        logError('[Accounting] findAccount error:', err);
        return null;
    }
};

/**
 * Creates or updates a journal entry when an invoice or return is confirmed (status != draft).
 * If status is 'draft', any existing entry for this invoice is removed.
 */
export const createInvoiceJournalEntry = async (transaction, companyId) => {
    try {
        if (!transaction || !companyId) return;

        // 1. Always delete any existing journal entry for this invoice/source to avoid duplicates
        await dailyRestrictionModel.findOneAndDelete({
            source: transaction.transactionNumber,
            companyId: companyId
        });

        // 2. If it's a draft, we stop here (no journal entry for drafts)
        if (transaction.status === 'draft') {
            console.log(`[Accounting] Invoice ${transaction.transactionNumber} is draft, journal entry removed if existed.`);
            return;
        }

        const totalAmount = Number(transaction.totalAmount || 0);
        const subtotal = Number(transaction.subtotal || 0);
        const totalTax = Number(transaction.totalTax || 0);

        if (totalAmount <= 0) return;

        const entries = [];

        // Universal VAT Account lookup
        const vatAccount = totalTax > 0
            ? await findAccount(companyId, ['2142', '214', '124', '21'], ['ضريبة القيمة المضافة', 'قيمة مضافة محصلة', 'VAT', 'ضريبة'])
            : null;

        if (transaction.module === 'sales') {
            const arAccount = await findAccount(companyId, ['126', '121', '12'], ['حسابات عملاء', 'حسابات العملاء', 'ذمم مدينة', 'مدينون', 'العملاء']);

            if (transaction.documentType === 'invoice') {
                // Dr. Accounts Receivable (126) -> totalAmount
                //   Cr. Sales Revenue (411) -> subtotal
                //   Cr. VAT (2142) -> totalTax
                const salesAccount = await findAccount(companyId, ['411', '41'], ['إيرادات المبيعات', 'المبيعات', 'مبيعات']);

                if (arAccount) entries.push({ account: arAccount, description: `فاتورة مبيعات رقم ${transaction.transactionNumber}`, debit: totalAmount, credit: 0 });
                if (salesAccount) entries.push({ account: salesAccount, description: `إيراد فاتورة ${transaction.transactionNumber}`, debit: 0, credit: subtotal > 0 ? subtotal : totalAmount });
                if (vatAccount && totalTax > 0) entries.push({ account: vatAccount, description: 'ضريبة القيمة المضافة المحصلة', debit: 0, credit: totalTax });

            } else if (transaction.documentType === 'return') {
                // Dr. Sales Return (412) -> subtotal
                // Dr. VAT (2142) -> totalTax
                //   Cr. Accounts Receivable (126) -> totalAmount
                const salesReturnAccount = await findAccount(companyId, ['412', '41'], ['مردودات مبيعات', 'مرتجع مبيعات', 'المبيعات']);

                if (salesReturnAccount) entries.push({ account: salesReturnAccount, description: `مردودات مبيعات للفاتورة ${transaction.transactionNumber}`, debit: subtotal > 0 ? subtotal : totalAmount, credit: 0 });
                if (vatAccount && totalTax > 0) entries.push({ account: vatAccount, description: 'ضريبة القيمة المضافة (مرتجع)', debit: totalTax, credit: 0 });
                if (arAccount) entries.push({ account: arAccount, description: `تخفيض ذمم مدينة لمرتجع ${transaction.transactionNumber}`, debit: 0, credit: totalAmount });
            }

        } else if (transaction.module === 'purchases') {
            const apAccount = await findAccount(companyId, ['212', '21'], ['حسابات موردين', 'موردون', 'دائنون', 'الموردين']);

            if (transaction.documentType === 'invoice') {
                // Dr. Purchases/Inventory (511/125) -> subtotal
                // Dr. Tax Receivable (124/214) -> totalTax
                //   Cr. Accounts Payable (212) -> totalAmount
                const purchasesAccount = await findAccount(companyId, ['511', '51', '125'], ['مشتريات', 'المشتروات', 'مخزون']);
                // For purchases, VAT is usually a receivable (Asset)
                const taxReceivableAccount = totalTax > 0
                    ? await findAccount(companyId, ['124', '214', '21'], ['ضريبة مدخلات', 'ضريبة قيمة مضافة مدفوعة', 'ضريبة'])
                    : null;

                if (purchasesAccount) entries.push({ account: purchasesAccount, description: `فاتورة مشتريات رقم ${transaction.transactionNumber}`, debit: subtotal > 0 ? subtotal : totalAmount, credit: 0 });
                if ((taxReceivableAccount || vatAccount) && totalTax > 0) {
                    entries.push({ account: taxReceivableAccount || vatAccount, description: 'ضريبة القيمة المضافة المدفوعة', debit: totalTax, credit: 0 });
                }
                if (apAccount) entries.push({ account: apAccount, description: `استحقاق مورد لفاتورة ${transaction.transactionNumber}`, debit: 0, credit: totalAmount });

            } else if (transaction.documentType === 'return') {
                // Dr. Accounts Payable (212) -> totalAmount
                //   Cr. Purchases Return (512) -> subtotal
                //   Cr. Tax Receivable (124/214) -> totalTax
                const purchasesReturnAccount = await findAccount(companyId, ['512', '51', '125'], ['مردودات مشتريات', 'مرتجع مشتريات', 'مخزون']);
                const taxReceivableAccount = totalTax > 0
                    ? await findAccount(companyId, ['124', '214', '21'], ['ضريبة مدخلات', 'ضريبة قيمة مضافة مدفوعة', 'ضريبة'])
                    : null;

                if (apAccount) entries.push({ account: apAccount, description: `تخفيض دائنون لمرتجع مشتريات ${transaction.transactionNumber}`, debit: totalAmount, credit: 0 });
                if (purchasesReturnAccount) entries.push({ account: purchasesReturnAccount, description: `مردودات مشتريات للفاتورة ${transaction.transactionNumber}`, debit: 0, credit: subtotal > 0 ? subtotal : totalAmount });
                if ((taxReceivableAccount || vatAccount) && totalTax > 0) {
                    entries.push({ account: taxReceivableAccount || vatAccount, description: 'ضريبة القيمة المضافة (مرتجع مشتريات)', debit: 0, credit: totalTax });
                }
            }
        }

        if (entries.length < 2) {
            console.log('[Accounting] Skipping invoice journal entry — insufficient accounts found for company', companyId);
            return;
        }

        const totalDebit = parseFloat(entries.reduce((s, e) => s + e.debit, 0).toFixed(2));
        const totalCredit = parseFloat(entries.reduce((s, e) => s + e.credit, 0).toFixed(2));
        const entryDate = transaction.issueDate ? new Date(transaction.issueDate) : new Date();

        let saved = false;
        let attempts = 0;
        while (!saved && attempts < 3) {
            try {
                const number = await generateJournalEntryNumber(companyId, entryDate);
                const restriction = new dailyRestrictionModel({
                    number,
                    date: entryDate,
                    description: `قيد آلي - فاتورة ${transaction.module === 'sales' ? 'مبيعات' : 'مشتريات'} ${transaction.transactionNumber}`,
                    source: transaction.transactionNumber,
                    totalDebit,
                    totalCredit,
                    entries,
                    companyId,
                    currency: transaction.currency || 'EGP',
                    invoiceId: transaction._id,
                    sourceType: 'invoice'
                });

                await restriction.save();
                console.log(`[Accounting] Invoice journal entry created successfully: ${restriction.number} for invoice ${transaction.transactionNumber}`);
                saved = true;
            } catch (err) {
                if (err.code === 11000 && attempts < 2) {
                    attempts++;
                    console.log(`[Accounting] Retrying journal entry for ${transaction.transactionNumber} due to race condition (attempt ${attempts})...`);
                } else {
                    throw err;
                }
            }
        }
    } catch (err) {
        logError('[Accounting] createInvoiceJournalEntry error (non-fatal):', err);
    }
};

/**
 * Removes a journal entry when an invoice is deleted.
 */
export const deleteInvoiceJournalEntry = async (transactionNumber, companyId) => {
    try {
        if (!transactionNumber || !companyId) return;
        await dailyRestrictionModel.findOneAndDelete({
            source: transactionNumber,
            companyId: companyId
        });
        console.log(`[Accounting] Journal entry for invoice ${transactionNumber} deleted.`);
    } catch (err) {
        logError('[Accounting] deleteInvoiceJournalEntry error:', err);
    }
};

/**
 * Creates a payment receipt/spend journal entry.
 */
export const createPaymentJournalEntry = async (payment, transaction, companyId) => {
    try {
        if (!payment || !companyId) return;

        const amount = Number(payment.amount || 0);
        if (amount <= 0) return;

        const treasuryType = payment.treasury === 'bank' ? 'bank' : 'cash';
        const operationType = payment.operationType || (transaction?.module === 'purchases' ? 'spend' : 'receive');
        const isSpend = operationType === 'spend';

        // Resolve accounts
        const cashAccount = await (treasuryType === 'bank'
            ? findAccount(companyId, ['11', '113'], ['بنك', 'حساب بنكي', 'البنك'])
            : findAccount(companyId, ['111', '11'], ['صندوق', 'نقدية', 'كاش']));

        const partyAccount = isSpend
            ? await findAccount(companyId, ['212', '21'], ['حسابات موردين', 'دائنون', 'موردون', 'الموردين'])
            : await findAccount(companyId, ['126', '121', '12'], ['حسابات عملاء', 'حسابات العملاء', 'ذمم مدينة', 'مدينون', 'العملاء']);

        const entries = [];

        if (isSpend) {
            // Debit: AP
            // Credit: Cash/Bank
            if (partyAccount) entries.push({ account: partyAccount, description: `سداد لمورد ${transaction?.transactionNumber || ''}`, debit: amount, credit: 0 });
            if (cashAccount) entries.push({ account: cashAccount, description: `صرف دفعة - ${payment.referenceNumber || ''}`, debit: 0, credit: amount });
        } else {
            // Debit: Cash/Bank
            // Credit: AR
            if (cashAccount) entries.push({ account: cashAccount, description: `تحصيل دفعة - ${transaction?.transactionNumber || ''}`, debit: amount, credit: 0 });
            if (partyAccount) entries.push({ account: partyAccount, description: `سداد من فاتورة ${transaction?.transactionNumber || ''}`, debit: 0, credit: amount });
        }

        if (entries.length < 2) {
            console.log('[Accounting] Skipping payment journal entry — insufficient accounts found for company', companyId);
            return;
        }

        const totalValue = parseFloat(amount.toFixed(2));
        const paymentDate = payment.date ? new Date(payment.date) : new Date();

        let saved = false;
        let attempts = 0;
        while (!saved && attempts < 3) {
            try {
                const number = await generateJournalEntryNumber(companyId, paymentDate);
                const restriction = new dailyRestrictionModel({
                    number,
                    date: paymentDate,
                    description: `قيد آلي - ${isSpend ? 'صرف' : 'تحصيل'} دفعة ${payment.referenceNumber || ''}`,
                    source: transaction?.transactionNumber || '',
                    totalDebit: totalValue,
                    totalCredit: totalValue,
                    entries,
                    companyId,
                    currency: payment.currency || transaction?.currency || 'EGP',
                    invoiceId: transaction?._id,
                    sourceType: 'payment'
                });

                await restriction.save();
                console.log(`[Accounting] Payment journal entry created successfully: ${restriction.number}`);
                saved = true;
            } catch (err) {
                if (err.code === 11000 && attempts < 2) {
                    attempts++;
                } else {
                    throw err;
                }
            }
        }
    } catch (err) {
        logError('[Accounting] createPaymentJournalEntry error (non-fatal):', err);
    }
};
