import { bankAccountModel } from "./bankAccount.model.js";

export const seedDefaultBankAccount = async (companyId) => {
    try {
        // Check if the default bank account already exists for this company
        const existingBankAccount = await bankAccountModel.findOne({ companyId, name: "الحساب البنكي الرئيسي" });
        if (existingBankAccount) return true;

        await bankAccountModel.create({
            companyId,
            name: "الحساب البنكي الرئيسي",
            balance: 0,
            accountNumber: "",
            branches: ["main"],
            enableReceiptPermissions: false,
            enablePaymentPermissions: false,
            custodians: [],
            users: []
        });

        return true;
    } catch (error) {
        console.error(`Error seeding default bank account for company ${companyId}:`, error);
        return false;
    }
};
