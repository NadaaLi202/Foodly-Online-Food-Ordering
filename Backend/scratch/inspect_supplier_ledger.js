import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION || 'mongodb://localhost:27017/accounting');
        console.log('DB Connected');

        const Account = mongoose.model('ChartOfAccounts', new mongoose.Schema({}, { strict: false }));
        const Journal = mongoose.model('DailyRestriction', new mongoose.Schema({}, { strict: false }));

        // 1. Find supplier accounts
        const supplierAccounts = await Account.find({
            code: { $regex: '^(211|212|21)' }
        }).select('name code type').lean();

        console.log('Supplier Accounts in systems:', supplierAccounts);

        // 2. Find any journal entries for these accounts
        const supplierAccIds = supplierAccounts.map(a => a._id);
        const entries = await Journal.find({
            'entries.account': { $in: supplierAccIds }
        }).limit(5).lean();

        console.log(`Found ${entries.length} journal entries for suppliers.`);
        if (entries.length > 0) {
            console.log('First entry sample:', JSON.stringify(entries[0], null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dbConnection();
