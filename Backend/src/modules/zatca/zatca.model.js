import mongoose from "mongoose";

const zatcaSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true
    },
    isEnabled: {
        type: Boolean,
        default: false
    },
    phase: {
        type: String,
        enum: ['phase1', 'phase2'],
        default: 'phase1'
    },
    settings: {
        // Phase 1 settings
        phase1: {
            isActive: { type: Boolean, default: false }
        },
        // Phase 2 settings (Integration)
        phase2: {
            isActive: { type: Boolean, default: false },
            environment: { type: String, enum: ['sandbox', 'simulation', 'production'], default: 'sandbox' },
            taxNumber: { type: String },
            otp: { type: String },
            otp2: { type: String },
            commonName: { type: String },
            organizationName: { type: String },
            organizationUnitName: { type: String },
            serialNumber: { type: String },
            registeredAddress: { type: String },
            businessCategory: { type: String },
            certificate: { type: String }, // For phase 2 storage
            privateKey: { type: String },  // For phase 2 storage
            secret: { type: String },       // For phase 2 storage
        }
    }
}, {
    timestamps: true
});

export const zatcaModel = mongoose.model('Zatca', zatcaSchema);
