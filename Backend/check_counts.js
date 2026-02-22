import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, './.env') });

const mongoURI = process.env.DB_CONNECTION || 'mongodb://localhost:27017/dafater';

async function checkCounts() {
    try {
        console.log('Connecting to:', mongoURI.replace(/\/\/.*@/, '//****:****@'));
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const Transaction = mongoose.connection.db.collection('transactions');
        const Payment = mongoose.connection.db.collection('payments');
        const Contact = mongoose.connection.db.collection('contacts');

        const transactionCount = await Transaction.countDocuments();
        const paymentCount = await Payment.countDocuments();
        const contactCount = await Contact.countDocuments();

        console.log('Counts:', {
            transactions: transactionCount,
            payments: paymentCount,
            contacts: contactCount
        });

        if (transactionCount > 0) {
            const sampleTxn = await Transaction.findOne();
            console.log('Sample Transaction Fields:', {
                _id: sampleTxn._id,
                module: sampleTxn.module,
                documentType: sampleTxn.documentType,
                issueDate: sampleTxn.issueDate,
                companyId: sampleTxn.companyId,
                companyIdType: typeof sampleTxn.companyId,
                isObjectId: sampleTxn.companyId instanceof mongoose.Types.ObjectId
            });
        }

        if (contactCount > 0) {
            const sampleContact = await Contact.findOne({ module: 'customer' });
            console.log('Sample Customer:', JSON.stringify(sampleContact, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkCounts();
