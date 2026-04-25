import * as dotenv from 'dotenv';
dotenv.config();
import { dbConnection } from '../dataBase/dbConnection.js';
import { companyModel } from '../src/modules/companies/company.model.js';
import { branchModel } from '../src/modules/branch/branch.model.js';
import { seedDefaultBranch } from '../src/modules/branch/branch.service.js';

async function migrate() {
    console.log("🔄 Connecting to DB...");
    await dbConnection();
    console.log("✅ DB Connected");

    const companies = await companyModel.find();
    console.log(`🔍 Found ${companies.length} companies.`);

    let seededCount = 0;
    let markedCount = 0;

    for (const company of companies) {
        const branches = await branchModel.find({ companyId: company._id });

        if (branches.length === 0) {
            // No branches → seed one
            console.log(`⚙️  Seeding main branch for company: ${company.name} (${company._id})`);
            const success = await seedDefaultBranch(company._id);
            if (success) seededCount++;
        } else {
            // Check if any branch is already flagged as main
            const hasMain = branches.some(b => b.is_main);
            if (!hasMain) {
                // Try to find the main branch by name pattern
                const mainBranch = branches.find(b =>
                    b.name && /فرع رئيسي|الفرع الرئيسي|main branch/i.test(b.name)
                ) || branches.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

                if (mainBranch) {
                    await branchModel.findByIdAndUpdate(mainBranch._id, { is_main: true });
                    console.log(`✅ Marked branch "${mainBranch.name}" as main for company: ${company.name}`);
                    markedCount++;
                }
            }
        }
    }

    console.log(`\n✅ Done! Seeded ${seededCount} new companies. Marked ${markedCount} existing branches as main.`);
    process.exit(0);
}

migrate().catch(err => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
