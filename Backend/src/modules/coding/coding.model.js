import mongoose from "mongoose";

const codingPartSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['fixed', 'year', 'branch', 'sequence'],
        required: true
    },
    value: {
        type: String, // Used for 'fixed' value
        default: ''
    },
    length: {
        type: Number, // Used for 'sequence' to pad with zeros
        default: 6
    }
}, { _id: false });

const codingSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    entity: {
        type: String,
        enum: [
            'invoices',
            'returns',
            'quotations',
            'purchase_invoices',
            'purchase_returns',
            'purchase_requests',
            'purchase_orders',
            'products',
            'customers',
            'suppliers',
            'journal_entries'
        ],
        required: true
    },
    parts: [codingPartSchema],
    prefix: {
        type: String,
        default: 'INV'
    },
    year: {
        type: String,
        default: () => new Date().getFullYear().toString().slice(-2)
    },
    branchScope: {
        type: String,
        enum: ['branch', 'global'],
        default: 'branch'
    },
    minDigits: {
        type: Number,
        min: 1,
        default: 6
    },
    separator: {
        type: String,
        default: '-'
    },
    currentSequence: {
        type: Number,
        min: 0,
        default: 0
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        default: null
    },
    // Map of branchId -> sequence (e.g., { "branch1Id": 0, "branch2Id": 100 })
    sequences: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

codingSchema.index({ companyId: 1, entity: 1 }, { unique: true });

export const codingModel = mongoose.model('Coding', codingSchema);
