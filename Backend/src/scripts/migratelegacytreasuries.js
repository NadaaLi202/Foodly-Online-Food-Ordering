import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Assuming running from backend dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DB_URI = process.env.DB_CONNECTION || process.env.DATABASE_URI || process.env.DB_URI;

if (!DB_URI) {
    console.error('No database URI found in environment variables.');
    process.exit(1);
}

const migrateLegacyTreasuries = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(DB_URI);
        console.log('Connected.');

        // Load models dynamically or define a simple schema for this migration
        const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
        
        console.log('Searching for legacy treasury values... ("main", "bank") or other non-ObjectId strings in Payment collection.');

        // Find payments where treasury is a string but not a valid ObjectId
        // We use $type: "string" and a regex that rejects valid 24-char hex strings.
        const legacyPayments = await Payment.find({
            treasury: { $type: "string", $not: /^[0-9a-fA-F]{24}$/ }
        });

        console.log(`Found ${legacyPayments.length} legacy payments with invalid treasury strings.`);

        if (legacyPayments.length === 0) {
            console.log('No legacy data to clean.');
        } else {
            for (const payment of legacyPayments) {
                console.log(`- Payment ID: ${payment._id}, Treasury: "${payment.get('treasury')}", Type: "${payment.get('operationType')}"`);
            }

            console.log('Setting legacy treasury values to null...');

            // Update them to null
            const result = await Payment.updateMany(
                { treasury: { $type: "string", $not: /^[0-9a-fA-F]{24}$/ } },
                { $set: { treasury: null } }
            );

            console.log(`Successfully updated ${result.modifiedCount} payments.`);
        }

        // Now do the same for AccountingTransactions if necessary
        const AccountingTransaction = mongoose.model('AccountingTransaction', new mongoose.Schema({}, { strict: false }));
        const legacyAcctTx = await AccountingTransaction.find({
            safe: { $type: "string", $not: /^[0-9a-fA-F]{24}$/ }
        });

        console.log(`\nFound ${legacyAcctTx.length} legacy accounting transactions with invalid safe strings.`);
        if (legacyAcctTx.length > 0) {
            for (const tx of legacyAcctTx) {
                console.log(`- Transaction ID: ${tx._id}, Safe: "${tx.get('safe')}"`);
            }
            const resultAcct = await AccountingTransaction.updateMany(
                { safe: { $type: "string", $not: /^[0-9a-fA-F]{24}$/ } },
                { $set: { safe: null } }
            );
            console.log(`Successfully updated ${resultAcct.modifiedCount} accounting transactions.`);
        }

        console.log('\nMigration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

migrateLegacyTreasuries();
