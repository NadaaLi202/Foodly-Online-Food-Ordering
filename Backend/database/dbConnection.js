import mongoose from "mongoose";
import logError from "../src/utils/logError.js";

export const dbConnection = async () => {
    try {
        const connectionString = process.env.MONGO_URI || process.env.DB_CONNECTION;

        if (!connectionString) {
            throw new Error("Database connection string is not defined in environment variables.");
        }

        await mongoose.connect(connectionString);
        console.log('Database connection successful');
    } catch (err) {
        logError('Database connection failed:', err.message);
        process.exit(1);
    }
};
