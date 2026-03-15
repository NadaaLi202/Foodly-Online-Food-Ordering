/**
 * transaction.accounting.js
 * 
 * Auto-creates journal entries (قيود يومية) when invoices are confirmed or paid.
 * Accounts are resolved dynamically from the company's chart of accounts.
 */

import { dailyRestrictionModel } from '../dailyRestrictions/dailyRestrictions.model.js';
import { chartOfAccountsModel } from '../chartOfAccounts/chartOfAccounts.model.js';
import logError from '../../utils/logError.js';

/**
 * Find an account in the company's chart by code prefix or name pattern.
 * Returns the account's code string (used as `account` field in entries), or null.
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
        }).select('code name').lean();

        return account ? `${account.name} #${account.code}` : null;
    } catch (err) {
        logError('[Accounting] findAccount error:', err);
        return null;
    }
};

/**
 * Creates a sales invoice journal entry when an invoice is confirmed (status != draft).
 * 
 * Dr. حساب العملاء (Accounts Receivable)  → totalAmount
 *   Cr. حساب المبيعات (Sales Revenue)     → subtotal
 *   Cr. ضريبة القيمة المضافة (VAT)        → totalTax (if > 0)
 */
export const createInvoiceJournalEntry = async (transaction, companyId) => {
    try {
        if (!transaction || !companyId) return;
        if (transaction.documentType !== 'invoice') return;
        if (transaction.module !== 'sales') return;

        const totalAmount = Number(transaction.totalAmount || 0);
        const subtotal = Number(transaction.subtotal || 0);
        const totalTax = Number(transaction.totalTax || 0);

        if (totalAmount <= 0) return;

        // Resolve accounts
        const [arAccount, salesAccount, vatAccount] = await Promise.all([
            findAccount(companyId,
                ['126', '121', '12'],
                ['حسابات عملاء', 'حسابات العملاء', 'ذمم مدينة', 'مدينون', 'العملاء']
            ),
            findAccount(companyId,
                ['411', '41'],
                ['إيرادات المبيعات', 'المبيعات', 'مبيعات']
            ),
            totalTax > 0
                ? findAccount(companyId,
                    ['2142', '214', '21'],
                    ['ضريبة القيمة المضافة', 'قيمة مضافة محصلة', 'VAT']
                )
                : Promise.resolve(null)
        ]);

        const entries = [];

        // Debit: Accounts Receivable
        if (arAccount) {
            entries.push({
                account: arAccount,
                description: `فاتورة مبيعات رقم ${transaction.transactionNumber}`,
                debit: totalAmount,
                credit: 0
            });
        }

        // Credit: Sales Revenue
        if (salesAccount) {
            entries.push({
                account: salesAccount,
                description: `إيراد فاتورة ${transaction.transactionNumber}`,
                debit: 0,
                credit: subtotal > 0 ? subtotal : totalAmount
            });
        }

        // Credit: VAT (if any)
        if (vatAccount && totalTax > 0) {
            entries.push({
                account: vatAccount,
                description: 'ضريبة القيمة المضافة المحصلة',
                debit: 0,
                credit: totalTax
            });
        }

        if (entries.length < 2) {
            // Not enough accounts resolved to create a balanced entry — skip silently
            console.log('[Accounting] Skipping invoice journal entry — insufficient accounts found for company', companyId);
            return;
        }

        const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
        const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

        const restriction = new dailyRestrictionModel({
            date: transaction.issueDate || new Date(),
            description: `قيد آلي - فاتورة مبيعات ${transaction.transactionNumber}`,
            source: transaction.transactionNumber,
            totalDebit,
            totalCredit,
            entries,
            companyId
        });

        await restriction.save();
        console.log(`[Accounting] Invoice journal entry created: ${restriction.number}`);
    } catch (err) {
        // Never throw — journal entry failure must not block invoice creation
        logError('[Accounting] createInvoiceJournalEntry error (non-fatal):', err);
    }
};

/**
 * Creates a payment receipt journal entry.
 * 
 * Dr. الصندوق/البنك (Cash/Bank)   → amount
 *   Cr. حساب العملاء (AR)          → amount
 */
export const createPaymentJournalEntry = async (payment, transaction, companyId) => {
    try {
        if (!payment || !companyId) return;

        const amount = Number(payment.amount || 0);
        if (amount <= 0) return;

        const treasuryType = payment.treasury === 'bank' ? 'bank' : 'cash';

        // Resolve accounts
        const [cashAccount, arAccount] = await Promise.all([
            treasuryType === 'bank'
                ? findAccount(companyId,
                    ['11', '113'],
                    ['بنك', 'حساب بنكي', 'البنك']
                )
                : findAccount(companyId,
                    ['111', '11'],
                    ['صندوق', 'نقدية', 'كاش']
                ),
            findAccount(companyId,
                ['126', '121', '12'],
                ['حسابات عملاء', 'حسابات العملاء', 'ذمم مدينة', 'مدينون', 'العملاء']
            )
        ]);

        const entries = [];

        // Debit: Cash or Bank
        if (cashAccount) {
            entries.push({
                account: cashAccount,
                description: `تحصيل دفعة - ${transaction?.transactionNumber || ''}`,
                debit: amount,
                credit: 0
            });
        }

        // Credit: Accounts Receivable
        if (arAccount) {
            entries.push({
                account: arAccount,
                description: `سداد من فاتورة ${transaction?.transactionNumber || ''}`,
                debit: 0,
                credit: amount
            });
        }

        if (entries.length < 2) {
            console.log('[Accounting] Skipping payment journal entry — insufficient accounts found for company', companyId);
            return;
        }

        const restriction = new dailyRestrictionModel({
            date: payment.date || new Date(),
            description: `قيد آلي - تحصيل دفعة ${payment.referenceNumber || ''}`,
            source: transaction?.transactionNumber || '',
            totalDebit: amount,
            totalCredit: amount,
            entries,
            companyId
        });

        await restriction.save();
        console.log(`[Accounting] Payment journal entry created: ${restriction.number}`);
    } catch (err) {
        logError('[Accounting] createPaymentJournalEntry error (non-fatal):', err);
    }
};
