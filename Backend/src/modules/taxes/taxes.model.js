import mongoose from "mongoose";

const taxesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tax name is required'],
        trim: true
    },
    percentage: {
        type: Number,
        required: [true, 'Tax percentage is required'],
        min: [0, 'Percentage cannot be negative']
    },
    isInclusive: {
        type: Boolean,
        default: false
    },
    paidTaxAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartOfAccounts',
        default: null
    },
    collectedTaxAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartOfAccounts',
        default: null
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

export const taxesModel = mongoose.model('Taxes', taxesSchema);
