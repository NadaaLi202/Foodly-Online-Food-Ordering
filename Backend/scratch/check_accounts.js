import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkAccounts() {
    try {
        await mongoose.connect(process.env.DB_CONNECTION);
        const db = mongoose.connection.db;
        const collection = db.collection('chartofaccounts');
        
        const codes = ['12610002', '21110002'];
        const accounts = await collection.find({ code: { $in: codes } }).toArray();
        
        console.log('Found accounts:');
        console.log(JSON.stringify(accounts, null, 2));
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAccounts();
