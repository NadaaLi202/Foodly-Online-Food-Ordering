import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { chartOfAccountsModel } from './backend/src/modules/chartofaccounts/chartofaccounts.model.js';

dotenv.config({ path: './backend/.env' });

async function debug() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const companyId = '69da1850d707a07e54b9a819'; // From user log
    const accounts = await chartOfAccountsModel.find({
        companyId,
        $or: [
            { code: { $regex: '^211' } },
            { name: { $regex: 'مورد|موردين|Suppliers', $options: 'i' } }
        ],
        type: 'sub'
    }).select("name code").lean();

    console.log("Found accounts:", accounts);
    process.exit(0);
}

debug();
