import mongoose from 'mongoose';
import { chartOfAccountsModel } from '../src/modules/chartOfAccounts/chartOfAccounts.model.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function check() {
    await mongoose.connect(process.env.DB_CONNECTION);
    const accounts = await chartOfAccountsModel.find({}).select('code name').lean();
    console.log('Accounts found:', accounts.length);
    const targetCodes = ["111", "112", "113", "114", "115", "121", "122", "123", "124", "125", "126", "127", "128", "129"];
    accounts.forEach(a => {
        if (targetCodes.includes(a.code)) {
            console.log(`MATCH: ${a.code} - ${a.name}`);
        }
    });
    process.exit(0);
}
check();
