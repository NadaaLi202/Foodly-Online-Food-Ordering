import { branchModel } from "./branch.model.js";
import { activityModel } from "../activity/activity.model.js";
import { partnerListModel } from "../listofpartners/listofpartners.model.js";

export const seedDefaultBranch = async (companyId) => {
    try {
        // 1. Create Default Activity
        let activity = await activityModel.findOne({ name: "النشاط التجاري الرئيسي", companyId });
        if (!activity) {
            activity = await activityModel.create({
                name: "النشاط التجاري الرئيسي",
                description: "النشاط التجاري الرئيسي الافتراضي",
                companyId
            });
        }

        // 2. Create Default Partner List
        let partnerList = await partnerListModel.findOne({ name: "قائمة الشركاء الافتراضية", companyId });
        if (!partnerList) {
            partnerList = await partnerListModel.create({
                name: "قائمة الشركاء الافتراضية",
                description: "قائمة الشركاء الافتراضية للفرع الرئيسي",
                companyId
            });
        }

        // 3. Create Main Branch
        const existingMainBranch = await branchModel.findOne({ companyId, is_main: true });
        if (!existingMainBranch) {
            await branchModel.create({
                companyId,
                name: "الفرع الرئيسي #1",
                code: "BR-001",
                activity: activity._id,
                partnerList: partnerList._id,
                partners: [partnerList._id],
                is_main: true,
                status: 'active'
            });
        }

        return true;
    } catch (error) {
        console.error(`Error seeding default branch for company ${companyId}:`, error);
        return false;
    }
};
