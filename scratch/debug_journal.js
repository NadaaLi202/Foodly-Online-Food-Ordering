import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dailyRestrictionModel } from '../backend/src/modules/dailyrestrictions/dailyrestrictions.model.js';
import { chartOfAccountsModel } from '../backend/src/modules/chartofaccounts/chartofaccounts.model.js';

dotenv.config({ path: '../backend/.env' });

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const companyId = '69da1850d707a07e54b9a819';

        // 1. Find some journal entries
        const entries = await dailyRestrictionModel.find({ companyId })
            .sort({ date: -1 })
            .limit(10)
            .populate("entries.account")
            .lean();

        console.log("Found", entries.length, "restrictions");

        const accountsUsed = new Set();
        entries.forEach(r => {
            r.entries.forEach(e => {
                const acc = e.account;
                if (acc) {
                    accountsUsed.add(`${acc.code} - ${acc.name}`);
                }
            });
        });

        console.log("Accounts used in recent entries:", Array.from(accountsUsed));

        // 2. Find supplier accounts
        const suppliers = await chartOfAccountsModel.find({
            companyId,
            $or: [
                { code: { $regex: '^211' } },
                { name: { $regex: 'مورد|موردين|Suppliers', $options: 'i' } }
            ]
        }).lean();

        console.log("Supplier accounts in CoA:", suppliers.map(s => `${s.code} - ${s.name}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
