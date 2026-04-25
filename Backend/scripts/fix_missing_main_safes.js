import * as dotenv from 'dotenv';
dotenv.config();
import { dbConnection } from '../dataBase/dbConnection.js';
import { companyModel } from '../src/modules/companies/company.model.js';
import { safeModel } from '../src/modules/Safes/safe.model.js';
import { seedDefaultSafe } from '../src/modules/Safes/safe.service.js';

async function migrate() {
    console.log("🔄 Connecting to DB...");
    await dbConnection();
    console.log("✅ DB Connected");

    const companies = await companyModel.find();
    console.log(`🔍 Found ${companies.length} companies.`);

    let seededCount = 0;
    let markedCount = 0;

    for (const company of companies) {
        const safes = await safeModel.find({ companyId: company._id });

        if (safes.length === 0) {
            // No safes → seed one
            console.log(`⚙️  Seeding main safe for company: ${company.name} (${company._id})`);
            const success = await seedDefaultSafe(company._id);
            if (success) seededCount++;
        } else {
            // Check if any safe is already flagged as main
            const hasMain = safes.some(s => s.isDefault);
            if (!hasMain) {
                // Mark oldest safe named "الخزنة الرئيسية" or just the first one
                const mainSafe = safes.find(s =>
                    s.name && /خزنة رئيسية|الخزنة الرئيسية|main safe|main/i.test(s.name)
                ) || safes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

                if (mainSafe) {
                    await safeModel.findByIdAndUpdate(mainSafe._id, { isDefault: true });
                    console.log(`✅ Marked safe "${mainSafe.name}" as main for company: ${company.name}`);
                    markedCount++;
                }
            }
        }
    }

    console.log(`\n✅ Done! Seeded ${seededCount} new companies. Marked ${markedCount} existing safes as main.`);
    process.exit(0);
}

migrate().catch(err => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
