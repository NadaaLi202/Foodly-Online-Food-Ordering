import { chartOfAccountsModel } from "./chartOfAccounts.model.js";

const DEFAULT_ACCOUNTS = [
    { code: '1', name: 'الأصول', type: 'asset', accountType: 'main' },
    { code: '2', name: 'الخصوم', type: 'liability', accountType: 'main' },
    { code: '3', name: 'رأس المال وحقوق الملكية', type: 'equity', accountType: 'main' },
    { code: '4', name: 'الإيرادات', type: 'revenue', accountType: 'main' },
    { code: '5', name: 'المصروفات', type: 'expense', accountType: 'main' }
];

const DEFAULT_SUB_ACCOUNTS = {
    '1': [
        { code: '11', name: 'الأصول الثابتة', type: 'asset', accountType: 'sub' },
        { code: '12', name: 'الأصول المتداولة', type: 'asset', accountType: 'sub' }
    ],
    '2': [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', accountType: 'sub' },
        { code: '22', name: 'الخصوم طويلة الأجل', type: 'liability', accountType: 'sub' }
    ],
    '3': [
        { code: '31', name: 'رأس المال', type: 'equity', accountType: 'sub' },
        { code: '32', name: 'أرباح وخسائر مرحلة', type: 'equity', accountType: 'sub' }
    ],
    '4': [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue', accountType: 'sub' },
        { code: '42', name: 'إيرادات أخرى', type: 'revenue', accountType: 'sub' }
    ],
    '5': [
        { code: '51', name: 'مصروفات المشتريات', type: 'expense', accountType: 'sub' },
        { code: '52', name: 'تكلفة المبيعات', type: 'expense', accountType: 'sub' },
        { code: '53', name: 'مصروفات إدارية وعمومية', type: 'expense', accountType: 'sub' },
        { code: '54', name: 'مصروفات أخرى', type: 'expense', accountType: 'sub' }
    ]
};

export const seedDefaultChartOfAccounts = async (companyId) => {
    try {
        // Check if company already has accounts
        const existingCount = await chartOfAccountsModel.countDocuments({ companyId });
        if (existingCount > 0) {
            return { message: 'Company already has chart of accounts', seeded: false };
        }

        const createdParents = {};

        // 1. Create Parent Accounts
        for (const account of DEFAULT_ACCOUNTS) {
            const newAccount = new chartOfAccountsModel({
                name: account.name,
                code: account.code,
                type: account.accountType, // The schema uses 'type' for main/sub
                companyId: companyId,
                status: 'active',
                branches: [] // assume all branches
            });
            await newAccount.save();
            createdParents[account.code] = newAccount._id;
        }

        // 2. Create Sub Accounts
        for (const parentCode of Object.keys(DEFAULT_SUB_ACCOUNTS)) {
            const parentId = createdParents[parentCode];
            if (!parentId) continue;

            const subAccounts = DEFAULT_SUB_ACCOUNTS[parentCode];
            for (const sub of subAccounts) {
                const newSubAccount = new chartOfAccountsModel({
                    name: sub.name,
                    code: sub.code,
                    type: sub.accountType,
                    parentAccount: parentId,
                    companyId: companyId,
                    status: 'active',
                    branches: []
                });
                await newSubAccount.save();
            }
        }

        return { message: 'Default chart of accounts seeded successfully', seeded: true };
    } catch (error) {
        console.error('Error seeding default chart of accounts:', error);
        throw error; // Or handle based on your preference
    }
};
