import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import FinancialReceipt from '../src/modules/FinancialTransactions/models/financialReceipt.model.js';
import FinancialDisbursement from '../src/modules/FinancialTransactions/models/financialDisbursement.model.js';
import FinancialTransfer from '../src/modules/FinancialTransactions/models/financialTransfer.model.js';
import AccountingTransaction from '../src/modules/FinancialTransactions/models/accountingTransaction.model.js';
import Transaction from '../src/modules/transaction/transaction.model.js';
import { safeModel } from '../src/modules/Safes/safe.model.js';
import { bankAccountModel } from '../src/modules/BankAccounts/bankAccount.model.js';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function diagnose() {
    try {
        await mongoose.connect(process.env.DB_CONNECTION);
        console.log("Connected to MongoDB");

        const receipts = await FinancialReceipt.find().limit(1).populate('account').lean();
        const disbursements = await FinancialDisbursement.find().limit(1).populate('account').lean();
        const transfers = await FinancialTransfer.find().limit(1).populate('fromAccount').populate('toAccount').lean();
        const accounting = await AccountingTransaction.find().limit(1).populate('safe').populate('invoiceId').lean();

        const report = {
            receipt: receipts[0],
            disbursement: disbursements[0],
            transfer: transfers[0],
            accounting: accounting[0]
        };

        console.log("DIAGNOSTIC REPORT:");
        console.log(JSON.stringify(report, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diagnose();
