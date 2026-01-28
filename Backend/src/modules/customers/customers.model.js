import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    status: {
        type: String,
        enum: ['Lead', 'Active', 'Inactive'],
        default: 'Lead'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Assuming User model exists
    }
}, { timestamps: true });

export const salesCustomerModel = mongoose.model("SalesCustomer", customerSchema);
