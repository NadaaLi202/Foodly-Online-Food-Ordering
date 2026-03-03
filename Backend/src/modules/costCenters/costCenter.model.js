import mongoose from "mongoose";

const costCenterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['main', 'sub'],
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CostCenter',
        alias: 'parent_id',
        default: null
    },
    isSystem: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        default: null
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    }
}, { timestamps: true });

costCenterSchema.index({ companyId: 1, name: 1, type: 1 });
costCenterSchema.index({ companyId: 1, parentId: 1 });

export const costCenterModel = mongoose.model('CostCenter', costCenterSchema);
