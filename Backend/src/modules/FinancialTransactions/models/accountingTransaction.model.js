import mongoose from "mongoose";

const schema = new mongoose.Schema({
    type: { type: String, enum: ['Income', 'Receivable', 'Expense', 'Payable'], required: true },
    amount: { type: Number, required: true },
    account: { type: String }, // Contact Name
    date: { type: Date },
    referenceCode: { type: String },
    description: { type: String },
    status: { type: String, default: 'completed' },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    safe: { type: mongoose.Schema.Types.ObjectId, refPath: 'safeModel' },
    safeModel: { type: String, enum: ['Safe', 'BankAccount'] },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("AccountingTransaction", schema);
