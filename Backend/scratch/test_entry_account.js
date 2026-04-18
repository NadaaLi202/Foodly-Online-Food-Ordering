import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION || 'mongodb://localhost:27017/accounting');
        const Journal = mongoose.model('DailyRestriction', new mongoose.Schema({}, { strict: false }));
        
        const res = await Journal.findOne({}).lean();
        if (res && res.entries && res.entries.length > 0) {
            console.log("Account type:", typeof res.entries[0].account);
            console.log("Account value:", res.entries[0].account);
            console.log("String() output:", String(res.entries[0].account));
        } else {
            console.log("No entries found");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dbConnection();
