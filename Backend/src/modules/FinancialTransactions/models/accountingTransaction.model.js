import mongoose from "mongoose";

const schema = new mongoose.Schema({
    type: { type: String, enum: ['Income', 'Receivable'], required: true },
    amount: { type: Number, required: true },
    account: { type: String },
    date: { type: Date },
    referenceCode: { type: String },
    status: { type: String, default: 'completed' },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
}, { timestamps: true });

export default mongoose.model("AccountingTransaction", schema);
