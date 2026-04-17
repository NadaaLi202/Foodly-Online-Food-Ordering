import { chartOfAccountsModel } from "./chartOfAccounts.model.js";

const LEDGER_ACCOUNTS = [
    { code: '1211', name: 'الخزنة الرئيسية', accountCategory: 'asset' },
    { code: '1221', name: 'الحساب البنكي الرئيسي', accountCategory: 'asset' },
    { code: '1251', name: 'المستودع الرئيسي', accountCategory: 'asset' },
    { code: '1262', name: 'أطراف مدينة أخرى', accountCategory: 'asset' },
    { code: '127', name: 'عجز وزيادة الصندوق', accountCategory: 'asset' },
    { code: '128', name: 'تغيير عملة', accountCategory: 'asset' },
    { code: '129', name: 'المشتريات تحت الإستلام', accountCategory: 'asset' },
    { code: '12610001', name: 'عملاء أخرون', accountCategory: 'asset' },
    { code: '12610002', name: 'سميرة سعيد للمقاولات', accountCategory: 'asset' },
    { code: '2112', name: 'أطراف دائنة أخرى', accountCategory: 'liability' },
    { code: '213', name: 'أرصدة افتتاحية', accountCategory: 'liability' },
    { code: '2141', name: 'القيمة المضافة المدفوعة', accountCategory: 'liability' },
    { code: '21110001', name: 'موردون أخرون', accountCategory: 'liability' },
    { code: '21110002', name: 'دلال محمد للدعية', accountCategory: 'liability' },
    { code: '32', name: 'أرباح وخسائر مرحلة', accountCategory: 'equity' },
    { code: '411', name: 'المبيعات', accountCategory: 'income' },
    { code: '412', name: 'مردودات المبيعات', accountCategory: 'income' },
    { code: '421', name: 'إيرادات أخرى', accountCategory: 'income' },
    { code: '422', name: 'أرباح وخسائر رأسمالية', accountCategory: 'income' },
    { code: '423', name: 'تسوية المشتريات', accountCategory: 'income' },
    { code: '511', name: 'المشتريات', accountCategory: 'expense' },
    { code: '512', name: 'مردودات المشتريات', accountCategory: 'expense' },
    { code: '521', name: 'تكلفة البضاعة المباعة', accountCategory: 'expense' },
    { code: '522', name: 'خصم مسموح به', accountCategory: 'expense' },
    { code: '523', name: 'تسوية المبيعات', accountCategory: 'expense' },
    { code: '5301', name: 'إيجار', accountCategory: 'expense' },
    { code: '5302', name: 'كهرباء', accountCategory: 'expense' },
    { code: '5303', name: 'هاتف وانترنت', accountCategory: 'expense' },
    { code: '5304', name: 'صيانة', accountCategory: 'expense' },
    { code: '5305', name: 'مياه', accountCategory: 'expense' },
    { code: '5306', name: 'مصاريف حكومية', accountCategory: 'expense' },
    { code: '541', name: 'الديون المعدومة', accountCategory: 'expense' },
    { code: '542', name: 'عجز وزيادة المخزون', accountCategory: 'expense' },
    { code: '543', name: 'مصروفات أخرى', accountCategory: 'expense' },
];

/**
 * Seeds the standard chart of accounts for a company.
 * Idempotent — skips accounts that already exist (matched by code + companyId).
 */
export const seedDefaultChartOfAccounts = async (companyId) => {
    try {
        let seededCount = 0;
        for (const acc of LEDGER_ACCOUNTS) {
            const existing = await chartOfAccountsModel.findOne({ code: acc.code, companyId });
            if (existing) {
                // Update accountCategory if missing (for pre-existing records)
                if (!existing.accountCategory) {
                    await chartOfAccountsModel.updateOne(
                        { _id: existing._id },
                        { $set: { accountCategory: acc.accountCategory } }
                    );
                }
                continue;
            }
            await chartOfAccountsModel.create({
                name: acc.name,
                code: acc.code,
                accountCategory: acc.accountCategory,
                type: 'sub',
                companyId,
                status: 'active',
                branches: []
            });
            seededCount++;
        }

        return {
            message: `Chart of accounts seeded: ${seededCount} new accounts added`,
            seeded: seededCount > 0
        };
    } catch (error) {
        console.error('Error seeding default chart of accounts:', error);
        throw error;
    }
};
