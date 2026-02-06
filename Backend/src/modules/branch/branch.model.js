import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    address1: {
        type: String,
        trim: true,
        default: ''
    },
    address2: {
        type: String,
        trim: true,
        default: ''
    },
    city: {
        type: String,
        trim: true,
        default: ''
    },
    neighborhood: {
        type: String,
        trim: true,
        default: ''
    },
    postalCode: {
        type: String,
        trim: true,
        default: ''
    },
    region: {
        type: String,
        trim: true,
        default: ''
    },
    country: {
        type: String,
        trim: true,
        default: ''
    },
    phone: {
        type: String,
        trim: true
    },
    commercialRegister: {
        type: String,
        trim: true
    },
    partnerList: {
        type: String, // Or ObjectId if referencing a PartnerList model
        required: true
    },
    activity: {
        type: String, // Or ObjectId if referencing an Activity model
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

export const branchModel = mongoose.model('Branch', branchSchema);
