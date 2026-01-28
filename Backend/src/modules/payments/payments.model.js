import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice", // Assuming Invoice model exists, or maybe Quote?
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash'],
        required: true
    },
    status: {
        type: String,
        enum: ['Completed', 'Pending', 'Failed'],
        default: 'Pending'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const paymentModel = mongoose.model("Payment", paymentSchema);
