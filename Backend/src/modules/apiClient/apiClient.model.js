import mongoose from "mongoose";
import crypto from "crypto";

const apiClientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String, // e.g., 'admin', 'accountant', 'viewer'
        required: true
    },
    branches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }],
    token: {
        type: String,
        unique: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

// Generate a secure token before saving
apiClientSchema.pre('save', function (next) {
    if (!this.token) {
        this.token = crypto.randomBytes(32).toString('hex');
    }
    next();
});

apiClientSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const apiClientModel = mongoose.model('ApiClient', apiClientSchema);
