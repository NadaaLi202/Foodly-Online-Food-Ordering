import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { migrateLegacyPayments } from './backend/src/modules/bankaccounts/bankaccount.service.js';

dotenv.config();

const runMigration = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/dafater");
        console.log("Connected.");

        const result = await migrateLegacyPayments();
        console.log("Migration Result:", result);

        process.exit(0);
    } catch (err) {
        console.error("Migration fatal error:", err);
        process.exit(1);
    }
};

runMigration();
