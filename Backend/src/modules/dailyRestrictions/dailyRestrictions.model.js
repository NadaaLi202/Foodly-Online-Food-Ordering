import mongoose from "mongoose";

const dailyRestrictionSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    totalDebit: {
        type: Number,
        required: true,
        default: 0
    },
    totalCredit: {
        type: Number,
        required: true,
        default: 0
    },
    attachment: {
        type: String
    },
    attachmentPublicId: {
        type: String
    },
    entries: [{
        account: {
            type: String, // Storing as string specifically requested or generic until Account model is confirmed
            required: true
        },
        description: {
            type: String,
            trim: true
        },
        debit: {
            type: Number,
            default: 0
        },
        credit: {
            type: Number,
            default: 0
        }
    }],
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    }
}, {
    timestamps: true
});

dailyRestrictionSchema.index({ number: 1, companyId: 1 }, { unique: true });

export const dailyRestrictionModel = mongoose.model('DailyRestriction', dailyRestrictionSchema);
