import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { dailyRestrictionModel } from './src/modules/dailyrestrictions/dailyrestrictions.model.js';
import { chartOfAccountsModel } from './src/modules/chartofaccounts/chartofaccounts.model.js';

async function migrate() {
    try {
        await mongoose.connect(process.env.DB_CONNECTION || 'mongodb://localhost:27017/alostaz');
        console.log('Connected to DB');

        const restrictions = await dailyRestrictionModel.find({});
        console.log(`Found ${restrictions.length} restrictions.`);

        let modified = 0;

        for (const restriction of restrictions) {
            let changed = false;

            for (const entry of restriction.entries) {
                if (entry.account && typeof entry.account === 'string' && entry.account.includes('#')) {
                    // Extract code, assuming format "Name #Code"
                    const parts = entry.account.split('#');
                    if (parts.length === 2) {
                        const code = parts[1].trim();
                        
                        const actualAccount = await chartOfAccountsModel.findOne({ 
                            companyId: restriction.companyId,
                            code: code 
                        });

                        if (actualAccount) {
                            entry.account = actualAccount._id.toString();
                            changed = true;
                        } else {
                            console.log(`Warning: Account code ${code} not found for company ${restriction.companyId}`);
                        }
                    }
                }
            }

            if (changed) {
                await restriction.save();
                modified++;
                console.log(`Updated restriction: ${restriction.number}`);
            }
        }

        console.log(`Migration complete. Modified ${modified} restrictions.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
