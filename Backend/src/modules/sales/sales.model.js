import mongoose from "mongoose";

const salesSchema = new mongoose.Schema({
    saleNumber: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesCustomer",
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'completed', 'cancelled', 'returned'],
        default: 'draft'
    },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesInvoice"
    },
    quoteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quote"
    },
    payments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    }],
    returnId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Return"
    },
    saleDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const salesModel = mongoose.model("Sale", salesSchema);
