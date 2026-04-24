import { chartOfAccountsModel } from "./chartofaccounts.model.js";

const ACCOUNTS_HIERARCHY = [
    { code: '1', name: 'الأصول', type: 'main', accountCategory: 'asset' },
    { code: '11', name: 'الأصول الثابتة', type: 'main', accountCategory: 'asset' },
    { code: '111', name: 'المباني', type: 'sub', accountCategory: 'asset' },
    { code: '112', name: 'الأراضي', type: 'sub', accountCategory: 'asset' },
    { code: '113', name: 'الأثاث', type: 'sub', accountCategory: 'asset' },
    { code: '114', name: 'الأجهزة والمعدات', type: 'sub', accountCategory: 'asset' },
    { code: '115', name: 'وسائل النقل', type: 'sub', accountCategory: 'asset' },
    { code: '12', name: 'الأصول المتداولة', type: 'main', accountCategory: 'asset' },
    { code: '121', name: 'الخزائن', type: 'main', accountCategory: 'asset' },
    { code: '1211', name: 'الخزنة الرئيسية', type: 'sub', accountCategory: 'asset' },
    { code: '122', name: 'الحسابات البنكية', type: 'main', accountCategory: 'asset' },
    { code: '1221', name: 'الحساب البنكي الرئيسي', type: 'sub', accountCategory: 'asset' },
    { code: '123', name: 'خزائن نقاط البيع', type: 'main', accountCategory: 'asset' },
    { code: '124', name: 'عهد الموظفين', type: 'main', accountCategory: 'asset' },
    { code: '125', name: 'المستودعات', type: 'main', accountCategory: 'asset' },
    { code: '1251', name: 'المستودع الرئيسي', type: 'sub', accountCategory: 'asset' },
    { code: '126', name: 'المدينون', type: 'main', accountCategory: 'asset' },
    { code: '12610001', name: 'عملاء أخرون', type: 'sub', accountCategory: 'asset' },
    { code: '12610002', name: 'سميرة سعيد للمقاولات', type: 'sub', accountCategory: 'asset' },
    { code: '1262', name: 'أطراف مدينة أخرى', type: 'sub', accountCategory: 'asset' },
    { code: '127', name: 'عجز وزيادة الصندوق', type: 'sub', accountCategory: 'asset' },
    { code: '128', name: 'تغيير عملة', type: 'sub', accountCategory: 'asset' },
    { code: '129', name: 'المشتريات تحت الإستلام', type: 'sub', accountCategory: 'asset' },
    
    { code: '2', name: 'الخصوم', type: 'main', accountCategory: 'liability' },
    { code: '21', name: 'الخصوم المتداولة', type: 'main', accountCategory: 'liability' },
    { code: '21110001', name: 'موردون أخرون', type: 'sub', accountCategory: 'liability' },
    { code: '21110002', name: 'دلال محمد للدعية', type: 'sub', accountCategory: 'liability' },
    { code: '2112', name: 'أطراف دائنة أخرى', type: 'sub', accountCategory: 'liability' },
    { code: '213', name: 'أرصدة افتتاحية', type: 'sub', accountCategory: 'liability' },
    { code: '2141', name: 'القيمة المضافة المدفوعة', type: 'sub', accountCategory: 'liability' },
    { code: '22', name: 'الخصوم طويلة الأجل', type: 'main', accountCategory: 'liability' },
    
    { code: '3', name: 'رأس المال وحقوق الملكية', type: 'main', accountCategory: 'equity' },
    { code: '31', name: 'رأس المال', type: 'main', accountCategory: 'equity' },
    { code: '32', name: 'أرباح وخسائر مرحلة', type: 'sub', accountCategory: 'equity' },
    
    { code: '4', name: 'الإيرادات', type: 'main', accountCategory: 'income' },
    { code: '41', name: 'إيرادات المبيعات', type: 'main', accountCategory: 'income' },
    { code: '411', name: 'المبيعات', type: 'sub', accountCategory: 'income' },
    { code: '412', name: 'مردودات المبيعات', type: 'sub', accountCategory: 'income' },
    { code: '42', name: 'إيرادات أخرى', type: 'main', accountCategory: 'income' },
    { code: '421', name: 'إيرادات أخرى', type: 'sub', accountCategory: 'income' },
    { code: '422', name: 'أرباح وخسائر رأسمالية', type: 'sub', accountCategory: 'income' },
    { code: '423', name: 'تسوية المشتريات', type: 'sub', accountCategory: 'income' },
    
    { code: '5', name: 'المصروفات', type: 'main', accountCategory: 'expense' },
    { code: '51', name: 'مصروفات المشتريات', type: 'main', accountCategory: 'expense' },
    { code: '511', name: 'المشتريات', type: 'sub', accountCategory: 'expense' },
    { code: '512', name: 'مردودات المشتريات', type: 'sub', accountCategory: 'expense' },
    { code: '52', name: 'تكلفة المبيعات', type: 'main', accountCategory: 'expense' },
    { code: '521', name: 'تكلفة البضاعة المباعة', type: 'sub', accountCategory: 'expense' },
    { code: '522', name: 'خصم مسموح به', type: 'sub', accountCategory: 'expense' },
    { code: '523', name: 'تسوية المبيعات', type: 'sub', accountCategory: 'expense' },
    { code: '53', name: 'مصروفات إدارية وعمومية', type: 'main', accountCategory: 'expense' },
    { code: '5301', name: 'إيجار', type: 'sub', accountCategory: 'expense' },
    { code: '5302', name: 'كهرباء', type: 'sub', accountCategory: 'expense' },
    { code: '5303', name: 'هاتف وانترنت', type: 'sub', accountCategory: 'expense' },
    { code: '5304', name: 'صيانة', type: 'sub', accountCategory: 'expense' },
    { code: '5305', name: 'مياه', type: 'sub', accountCategory: 'expense' },
    { code: '5306', name: 'مصاريف حكومية', type: 'sub', accountCategory: 'expense' },
    { code: '54', name: 'مصروفات أخرى', type: 'main', accountCategory: 'expense' },
    { code: '541', name: 'الديون المعدومة', type: 'sub', accountCategory: 'expense' },
    { code: '542', name: 'عجز وزيادة المخزون', type: 'sub', accountCategory: 'expense' },
    { code: '543', name: 'مصروفات أخرى', type: 'sub', accountCategory: 'expense' }
];

export const seedDefaultChartOfAccounts = async (companyId) => {
    try {
        let seededCount = 0;
        
        // 1. Create all accounts without parent links first
        for (const acc of ACCOUNTS_HIERARCHY) {
            const existing = await chartOfAccountsModel.findOne({ code: acc.code, companyId });
            if (!existing) {
                await chartOfAccountsModel.create({
                    name: acc.name,
                    code: acc.code,
                    accountCategory: acc.accountCategory,
                    type: acc.type,
                    companyId,
                    status: 'active',
                    branches: []
                });
                seededCount++;
            } else {
                let needUpdate = false;
                const updates = {};
                if (existing.type !== acc.type) { updates.type = acc.type; needUpdate = true; }
                if (existing.accountCategory !== acc.accountCategory) { updates.accountCategory = acc.accountCategory; needUpdate = true; }
                
                if (needUpdate) {
                    await chartOfAccountsModel.updateOne(
                        { _id: existing._id },
                        { $set: updates }
                    );
                }
            }
        }

        // 2. Resolve parent-child relationships
        const allAccounts = await chartOfAccountsModel.find({ companyId });
        const accountsByCode = {};
        for (const account of allAccounts) {
            accountsByCode[account.code] = account;
        }

        let updateCount = 0;
        for (const account of allAccounts) {
            let parentCode = null;
            const code = account.code;
            
            // Find longest matching prefix
            for (let i = code.length - 1; i > 0; i--) {
                const prefix = code.substring(0, i);
                if (accountsByCode[prefix] && accountsByCode[prefix].type === 'main') {
                    parentCode = prefix;
                    break;
                }
            }

            if (parentCode) {
                const parentId = accountsByCode[parentCode]._id;
                if (!account.parentAccount || account.parentAccount.toString() !== parentId.toString()) {
                    await chartOfAccountsModel.updateOne(
                        { _id: account._id },
                        { $set: { parentAccount: parentId } }
                    );
                    updateCount++;
                }
            } else if (account.parentAccount) {
                await chartOfAccountsModel.updateOne(
                    { _id: account._id },
                    { $set: { parentAccount: null } }
                );
            }
        }

        return {
            message: `Chart of accounts verified: ${seededCount} new accounts added, ${updateCount} links updated`,
            seeded: true
        };
    } catch (error) {
        console.error('Error seeding default chart of accounts:', error);
        throw error;
    }
};
