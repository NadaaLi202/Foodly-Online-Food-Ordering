import mongoose from "mongoose";

const partnerListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const partnerListModel = mongoose.model('PartnerList', partnerListSchema);
