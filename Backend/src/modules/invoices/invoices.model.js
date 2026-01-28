import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesCustomer", // Using the Local SalesCustomer model we created
        required: true
    },
    items: [{
        name: {
            type: String,
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
        enum: ['paid', 'pending', 'cancelled'],
        default: 'pending'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    }
}, { timestamps: true });

export const invoiceModel = mongoose.model("SalesInvoice", invoiceSchema); // Named SalesInvoice to distinguish from potential legacy Invoice
