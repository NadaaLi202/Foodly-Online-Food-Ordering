// المبيعات : الفواتير - المرتجعات - عروض اسعار
// المشتريات : الفواتير - المرتجعات - طلبات شراء

import mongoose from "mongoose";
import { SUPPORTED_CURRENCIES } from "../../constants/currencies.js";

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const transactionLineSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    quantity: {
        type: Number,
        required: true,
        min: 0.01
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    discountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
        default: 0
    },
    taxPercent: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
    transactionNumber: {
        type: String,
        required: true,
        trim: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    },
    warehouse: {
        type: mongoose.Schema.Types.Mixed,
        default: 'main'
    },

    module: {
        type: String,
        enum: ['sales', 'purchases'],
        required: true
    },

    documentType: {
        type: String,
        enum: ['invoice', 'return', 'quotation', 'purchaseOrder', 'request'],
        required: true,
        default: 'invoice'
    },

    currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        required: true,
        default: "EGP"
    },

    contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: true
    },

    companySnapshot: {
        type: Object,
        default: {}
    },

    contactSnapshot: {
        type: Object,
        default: {}
    },

    issueDate: {
        type: Date,
        default: Date.now
    },

    dueDate: {
        type: Date
    },

    generalDiscount: {
        type: Number,
        default: 0,
        min: 0
    },

    generalDiscountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    items: [transactionLineSchema],

    subtotal: {
        type: Number,
        default: 0
    },

    totalDiscount: {
        type: Number,
        default: 0
    },

    totalTax: {
        type: Number,
        default: 0
    },

    totalAmount: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: [
            'draft',
            'issued',
            'paid',
            'partial',
            'partially_paid',
            'unpaid',
            'overdue',
            'cancelled',
            'sent',
            'accepted',
            'rejected',
            'expired',
            'converted_to_invoice'
        ],
        default: 'draft'
    },

    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    remainingAmount: {
        type: Number,
        default: 0
    },

    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'check', 'credit'],
        default: 'cash'
    },

    referenceNumber: {
        type: String,
        default: ''
    },

    isSent: {
        type: Boolean,
        default: false
    },

    sentDate: Date,
    acceptedDate: Date,
    rejectedDate: Date,

    rejectionReason: {
        type: String,
        default: ''
    },

    relatedTransactionNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },

    notes: {
        type: String,
        default: ''
    },

    internalNotes: {
        type: String,
        default: ''
    },

    attachments: [{
        fileName: String,
        fileUrl: String,
        publicId: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true });


// ================= PRE SAVE =================
transactionSchema.pre('save', function (next) {
    console.log('[DEBUG] pre-save hook called');
    if (!this.items || this.items.length === 0) return next();

    this.subtotal = 0;
    this.totalDiscount = 0;
    this.totalTax = 0;

    this.items.forEach(item => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const discountPercent = Number(item.discountPercent || 0);
        const fixedDiscountAmount = Number(item.discountAmount || 0);
        const taxPercent = Number(item.taxPercent || 0);

        const lineSubtotal = round2(quantity * unitPrice);

        const computedDiscount = discountPercent > 0
            ? round2(lineSubtotal * (discountPercent / 100))
            : round2(Math.min(Math.max(fixedDiscountAmount, 0), lineSubtotal));
        item.discountAmount = computedDiscount;
        item.subtotal = round2(lineSubtotal - item.discountAmount);

        item.taxAmount = round2(item.subtotal * (taxPercent / 100));
        item.total = round2(item.subtotal + item.taxAmount);

        this.subtotal = round2(this.subtotal + item.subtotal);
        this.totalDiscount = round2(this.totalDiscount + item.discountAmount);
        this.totalTax = round2(this.totalTax + item.taxAmount);
    });

    if (this.generalDiscountPercent > 0) {
        this.generalDiscount = round2(this.subtotal * (this.generalDiscountPercent / 100));
    }

    this.subtotal = round2(this.subtotal - (this.generalDiscount || 0));
    this.totalDiscount = round2(this.totalDiscount + (this.generalDiscount || 0));

    this.totalAmount = round2(this.subtotal + this.totalTax);

    // ✅ التعديل المهم هنا
    if (this.documentType === 'invoice') {
        this.remainingAmount = round2(this.totalAmount - (this.paidAmount || 0));
    } else {
        this.remainingAmount = 0;
    }

    next();
});


// ================= VIRTUALS =================
transactionSchema.virtual('balance').get(function () {
    return this.totalAmount - this.paidAmount;
});

transactionSchema.virtual('isExpired').get(function () {
    if (this.documentType !== 'quotation' || !this.dueDate) return false;
    return new Date() > this.dueDate;
});


// ================= METHODS =================
transactionSchema.methods.convertToReturn = function () {
    if (this.documentType !== 'invoice') {
        throw new Error('المرتجع متاح فقط للفواتير');
    }
    this.documentType = 'return';
    this.items.forEach(i => i.quantity = -i.quantity);
    return this.save();
};

transactionSchema.methods.convertToInvoice = function (invoiceId, userId) {
    if (this.documentType !== 'quotation') {
        throw new Error('التحويل متاح فقط للعروض');
    }
    this.status = 'converted_to_invoice';
    this.relatedTransactionNumber = invoiceId;
    this.lastModifiedBy = userId;
    return this.save();
};

transactionSchema.methods.softDelete = function (userId) {
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
};

transactionSchema.methods.restore = function () {
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export default Transaction;
