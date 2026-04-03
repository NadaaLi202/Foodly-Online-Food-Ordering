import { safeModel } from "./safe.model.js";
import { branchModel } from "../branch/branch.model.js";

export const seedDefaultSafe = async (companyId) => {
    try {
        // Check if main safe already exists
        const existingMainSafe = await safeModel.findOne({ companyId, isDefault: true });
        if (existingMainSafe) return true;

        // Find the main branch to link the safe to
        const mainBranch = await branchModel.findOne({ companyId, is_main: true });

        await safeModel.create({
            companyId,
            name: "الخزنة الرئيسية",
            balance: 0,
            isDefault: true,
            branches: ["main"],
            enableReceiptPermissions: false,
            enablePaymentPermissions: false
        });

        return true;
    } catch (error) {
        console.error(`Error seeding default safe for company ${companyId}:`, error);
        return false;
    }
};
