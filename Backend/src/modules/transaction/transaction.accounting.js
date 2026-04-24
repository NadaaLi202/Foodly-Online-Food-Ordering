/**
 * transaction.accounting.js
 * 
 * Auto-creates journal entries (قيود يومية) when invoices are confirmed or paid.
 * Accounts are resolved dynamically from the company's chart of accounts.
 */

import { dailyRestrictionModel } from '../dailyrestrictions/dailyrestrictions.model.js';
import { chartOfAccountsModel } from '../chartofaccounts/chartofaccounts.model.js';
import mongoose from 'mongoose';
import logError from '../../utils/logerror.js';

/**
 * Generate the next journal entry number for a given company.
 * Replicates the pre-save hook logic so we can supply the number explicitly,
 * avoiding the Mongoose validate-before-hook race condition.
 */
export const generateJournalEntryNumber = async (companyId, date = new Date()) => {
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
export const findAccount = async (companyId, codePatterns = [], namePatterns = []) => {
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

        if (account) {
            console.log(`[Accounting] Resolved account: ${account.code} - ${account.name} (id: ${account._id})`);
        }
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
            ? await findAccount(companyId, ['214', '124', '21', '2'], ['ضريبة', 'VAT'])
            : null;

        if (transaction.module === 'sales') {
            const arAccount = await findAccount(companyId, ['126', '121', '12'], ['عملاء', 'مدينون', 'Customers', 'Receivable']);
            const salesAccount = await findAccount(companyId, ['411', '41'], ['إيرادات المبيعات', 'المبيعات', 'مبيعات', 'Sales', 'Revenue']);

            if (transaction.documentType === 'invoice') {
                if (arAccount) entries.push({ account: arAccount, description: `إثبات مبيعات آجلة - فاتورة ${transaction.transactionNumber}`, debit: totalAmount, credit: 0 });
                if (salesAccount) entries.push({ account: salesAccount, description: `إيراد المبيعات - فاتورة ${transaction.transactionNumber}`, debit: 0, credit: subtotal || totalAmount });
                if (vatAccount && totalTax > 0) entries.push({ account: vatAccount, description: 'ضريبة القيمة المضافة المحصلة', debit: 0, credit: totalTax });

            } else if (transaction.documentType === 'return') {
                const salesReturnAccount = await findAccount(companyId, ['412', '41'], ['مردودات مبيعات', 'مرتجع مبيعات', 'Returns']);
                if (salesReturnAccount) entries.push({ account: salesReturnAccount, description: `مردودات مبيعات - فاتورة ${transaction.transactionNumber}`, debit: subtotal || totalAmount, credit: 0 });
                if (vatAccount && totalTax > 0) entries.push({ account: vatAccount, description: 'ضريبة القيمة المضافة (مرتجع)', debit: totalTax, credit: 0 });
                if (arAccount) entries.push({ account: arAccount, description: `تخفيض ذمم لمرتجع ${transaction.transactionNumber}`, debit: 0, credit: totalAmount });
            }

        } else if (transaction.module === 'purchases') {
            const apAccount = await findAccount(companyId, ['212', '21'], ['موردون', 'دائنون', 'Suppliers', 'Payable']);

            if (transaction.documentType === 'invoice') {
                const purchasesAccount = await findAccount(companyId, ['511', '51', '125'], ['مشتريات', 'مخزون', 'Purchases', 'Inventory']);
                if (purchasesAccount) entries.push({ account: purchasesAccount, description: `إثبات مشتريات - فاتورة ${transaction.transactionNumber}`, debit: subtotal || totalAmount, credit: 0 });
                if (vatAccount && totalTax > 0) entries.push({ account: vatAccount, description: 'ضريبة القيمة المضافة المدفوعة', debit: totalTax, credit: 0 });
                if (apAccount) entries.push({ account: apAccount, description: `إثبات استحقاق مورد - فاتورة ${transaction.transactionNumber}`, debit: 0, credit: totalAmount });

            } else if (transaction.documentType === 'return') {
                const purchasesReturnAccount = await findAccount(companyId, ['512', '51', '125'], ['مردودات مشتريات', 'مرتجع مشتريات']);
                if (apAccount) entries.push({ account: apAccount, description: `تخفيض دائنون لمرتجع ${transaction.transactionNumber}`, debit: totalAmount, credit: 0 });
                if (purchasesReturnAccount) entries.push({ account: purchasesReturnAccount, description: `مردودات مشتريات - فاتورة ${transaction.transactionNumber}`, debit: 0, credit: subtotal || totalAmount });
                if (vatAccount && totalTax > 0) entries.push({ account: vatAccount, description: 'ضريبة القيمة المضافة (مرتجع)', debit: 0, credit: totalTax });
            }
        }

        if (entries.length < 2) {
            console.warn(`[Accounting] WARNING: Skipping invoice journal entry ${transaction.transactionNumber} — Insufficient accounts found. [AR/AP: ${!!entries.find(e=>e.debit>0||e.credit>0)}, Revenue/Exp: ${entries.length > 1}]`);
            return;
        }

        const totalDebit = parseFloat(entries.reduce((s, e) => s + e.debit, 0).toFixed(2));
        const totalCredit = parseFloat(entries.reduce((s, e) => s + e.credit, 0).toFixed(2));
        const entryDate = transaction.issueDate ? new Date(transaction.issueDate) : new Date();

        let savedEntryId = null;
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
                
                // User requested log
                console.log('[JOURNAL] Created entry:', {
                    id: restriction._id,
                    number: restriction.number,
                    entries: restriction.entries
                });

                console.log(`[Accounting] Invoice journal entry created successfully: ${restriction.number} for invoice ${transaction.transactionNumber}`);
                savedEntryId = restriction._id;
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
        return savedEntryId;
    } catch (err) {
        logError('[Accounting] createInvoiceJournalEntry error (non-fatal):', err);
        return null;
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

        // Try to fetch bank/safe account directly if treasury is provided
        let treasuryAccount = null;
        if (payment.treasury && mongoose.Types.ObjectId.isValid(payment.treasury)) {
            const { bankAccountModel } = await import('../bankaccounts/bankaccount.model.js');
            const { safeModel } = await import('../safes/safe.model.js');
            
            if (payment.treasuryType === 'bank') {
                const bankAcc = await bankAccountModel.findById(payment.treasury).lean();
                treasuryAccount = bankAcc?.journalAccount;
            } else {
                const safe = await safeModel.findById(payment.treasury).lean();
                treasuryAccount = safe?.journalAccount;
            }
        }

        // Fallback to pattern search if no direct account linked
        const cashAccount = treasuryAccount || (payment.treasuryType === 'bank'
            ? await findAccount(companyId, ['122', '113', '11'], ['بنك', 'Bank'])
            : await findAccount(companyId, ['111', '11', '1'], ['صندوق', 'كاش', 'Cash', 'Safe']));

        const isSpend = payment.operationType === 'spend' || (transaction?.module === 'purchases');
        const partyAccount = isSpend
            ? await findAccount(companyId, ['212', '21'], ['موردون', 'دائنون', 'Suppliers', 'Payable'])
            : await findAccount(companyId, ['126', '121', '12'], ['عملاء', 'مدينون', 'Customers', 'Receivable']);

        if (!cashAccount || !partyAccount) {
            console.warn(`[Accounting] Cannot create payment journal entry: Missing account. [Treasury: ${!!cashAccount}, Party: ${!!partyAccount}]`);
            return;
        }

        const entries = [];
        if (isSpend) {
            // Debit: AP, Credit: Cash/Bank
            entries.push({ account: partyAccount, description: `سداد فاتورة ${transaction?.transactionNumber || ''}`, debit: amount, credit: 0 });
            entries.push({ account: cashAccount, description: `دفع من البنك/الخزنة - فاتورة ${transaction?.transactionNumber || ''}`, debit: 0, credit: amount });
        } else {
            // Debit: Cash/Bank, Credit: AR
            entries.push({ account: cashAccount, description: `تحصيل فاتورة ${transaction?.transactionNumber || ''}`, debit: amount, credit: 0 });
            entries.push({ account: partyAccount, description: `سداد فاتورة مبيعات ${transaction?.transactionNumber || ''}`, debit: 0, credit: amount });
        }

        const paymentDate = payment.date ? new Date(payment.date) : new Date();
        let saved = false;
        let attempts = 0;
        while (!saved && attempts < 3) {
            try {
                const number = await generateJournalEntryNumber(companyId, paymentDate);
                const restriction = new dailyRestrictionModel({
                    number,
                    date: paymentDate,
                    description: `قيد سداد آلي - ${isSpend ? 'صرف' : 'تحصيل'} دفعة للرقم ${transaction?.transactionNumber || payment.referenceNumber || ''}`,
                    source: transaction?.transactionNumber || payment.referenceNumber || '',
                    totalDebit: amount,
                    totalCredit: amount,
                    entries,
                    companyId,
                    currency: payment.currency || transaction?.currency || 'EGP',
                    invoiceId: transaction?._id,
                    sourceType: 'payment'
                });

                await restriction.save();
                console.log(`[Accounting] Payment journal entry created: ${restriction.number}`);
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
        logError('[Accounting] createPaymentJournalEntry error:', err);
    }
};
