import mongoose from "mongoose";

// Reusable row format sub-schema
const formatSchema = new mongoose.Schema({
    fontSize: { type: Number, default: 12 },
    color: { type: String, default: '#000000' },
    align: { type: String, enum: ['left', 'center', 'right'], default: 'right' },
    bold: { type: Boolean, default: false }
}, { _id: false });

// A single text row with formatting
const rowSchema = new mongoose.Schema({
    text: { type: String, default: '' },
    format: { type: formatSchema, default: () => ({}) }
}, { _id: false });

// Signature block (used in Footer)
const signatureSchema = new mongoose.Schema({
    rows: { type: [rowSchema], default: [{ text: '', format: {} }] },
    imageUrl: { type: String, default: '' },
    imageSize: { type: Number, default: 100 }
}, { _id: false });

// Table column config (for Invoice templates)
const tableColumnSchema = new mongoose.Schema({
    key: { type: String }, // internal key e.g. 'lineNumber', 'description'
    label: { type: String },
    enabled: { type: Boolean, default: true },
    labelFormat: { type: formatSchema, default: () => ({}) },
    valueFormat: { type: formatSchema, default: () => ({}) }
}, { _id: false });

// Page configuration
const pageConfigSchema = new mongoose.Schema({
    direction: { type: String, enum: ['rtl', 'ltr'], default: 'rtl' },
    pageSize: { type: String, default: 'A4' },
    fontSize: { type: Number, default: 12 },
    margins: {
        top: { type: Number, default: 15 },
        right: { type: Number, default: 15 },
        bottom: { type: Number, default: 15 },
        left: { type: Number, default: 15 }
    }
}, { _id: false });

// Main template schema
const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true
    },

    // Template type
    type: {
        type: String,
        enum: ['general', 'invoice', 'product-label'],
        required: [true, 'Template type is required']
    },

    // Design ID for invoice templates
    designId: {
        type: String,
        default: 'design-1'
    },

    // Which branches this template applies to (empty = all branches)
    branches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }],

    // Company ownership
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company ID is required'],
        index: true
    },

    // ─── Page Settings ─────────────────────────────────────────────
    page: { type: pageConfigSchema, default: () => ({}) },

    // ─── Logo ──────────────────────────────────────────────────────
    logo: {
        url: { type: String, default: '' },
        size: { type: Number, default: 70 },
        margins: {
            top: { type: Number, default: 0 },
            right: { type: Number, default: 0 },
            bottom: { type: Number, default: 0 },
            left: { type: Number, default: 0 }
        }
    },

    // ─── Header (General + Invoice: company/invoice info rows) ─────
    header: {
        rows: { type: [rowSchema], default: () => ([{ text: '', format: {} }]) },
        // Invoice-specific header options
        order: { type: String, default: 'Logo, Company Info, Invoice Info' },
        showBottomBorder: { type: Boolean, default: false },
        // Invoice Info rows
        invoiceInfoRows: { type: [rowSchema], default: () => ([{ text: '', format: {} }]) },
        // Document Titles (Invoice)
        titles: {
            saleInvoice: { type: rowSchema, default: () => ({ text: 'فاتورة ضريبية مبسطة', format: { fontSize: 14, bold: true } }) },
            saleCreditNote: { type: rowSchema, default: () => ({ text: 'فاتورة مرتجعات', format: { fontSize: 14, bold: true } }) },
            purchaseInvoice: { type: rowSchema, default: () => ({ text: 'فاتورة مشتريات', format: { fontSize: 14, bold: true } }) },
            purchaseCreditNote: { type: rowSchema, default: () => ({ text: 'فاتورة مرتجعات مشتريات', format: { fontSize: 14, bold: true } }) },
            quotation: { type: rowSchema, default: () => ({ text: 'عرض سعر', format: { fontSize: 14, bold: true } }) },
            salesOrder: { type: rowSchema, default: () => ({ text: 'أمر بيع', format: { fontSize: 14, bold: true } }) },
            purchaseRequest: { type: rowSchema, default: () => ({ text: 'طلب شراء', format: { fontSize: 14, bold: true } }) },
            purchaseOrder: { type: rowSchema, default: () => ({ text: 'أمر شراء', format: { fontSize: 14, bold: true } }) }
        }
    },

    // ─── Content (General: language only) ─────────────────────────
    content: {
        language: { type: String, enum: ['ar', 'en'], default: 'ar' }
    },

    // ─── Footer ────────────────────────────────────────────────────
    footer: {
        signaturePosition: {
            type: String,
            enum: ['after_notes', 'bottom'],
            default: 'after_notes'
        },
        signatures: {
            type: [{
                label: String,
                rows: { type: [rowSchema], default: () => ([{ text: '', format: {} }]) },
                imageUrl: { type: String, default: '' },
                imageSize: { type: Number, default: 100 }
            }],
            default: () => ([
                { label: 'left', rows: [{ text: '', format: {} }], imageUrl: '', imageSize: 100 },
                { label: 'middle', rows: [{ text: '', format: {} }], imageUrl: '', imageSize: 100 },
                { label: 'right', rows: [{ text: '', format: {} }], imageUrl: '', imageSize: 100 }
            ])
        },
        beforeRows: { type: [rowSchema], default: () => ([{ text: '', format: {} }]) },
        afterRows: { type: [rowSchema], default: () => ([{ text: '', format: {} }]) },
        notesRows: { type: [rowSchema], default: () => ([{ text: '', format: {} }]) }
    },

    // ─── Partner (Invoice: client/supplier info) ───────────────────
    partner: {
        clientRows: {
            type: [rowSchema],
            default: () => ([
                { text: '{{invoice.partner.name}}', format: { fontSize: 12 } },
                { text: '{{invoice.partner.street}}', format: { fontSize: 11 } },
                { text: 'الرقم الضريبي : {{invoice.partner.vat}}', format: { fontSize: 11 } }
            ])
        },
        supplierRows: {
            type: [rowSchema],
            default: () => ([
                { text: '{{invoice.partner.name}}', format: { fontSize: 12 } },
                { text: '{{invoice.partner.street}}', format: { fontSize: 11 } }
            ])
        }
    },

    // ─── Table (Invoice) ───────────────────────────────────────────
    table: {
        deductTaxFromAmounts: { type: Boolean, default: false },
        showTableLines: { type: Boolean, default: true },
        cellMargins: {
            top: { type: Number, default: 3 },
            right: { type: Number, default: 5 },
            bottom: { type: Number, default: 3 },
            left: { type: Number, default: 5 }
        },
        columns: {
            type: [tableColumnSchema],
            default: () => ([
                { key: 'lineNumber', label: 'البند', enabled: true },
                { key: 'description', label: 'الوصف', enabled: true },
                { key: 'quantity', label: 'الكمية', enabled: true },
                { key: 'price', label: 'السعر', enabled: true },
                { key: 'taxRate', label: 'نسبة الضريبة', enabled: true },
                { key: 'total', label: 'الإجمالي', enabled: true },
                { key: 'discount', label: 'الخصم', enabled: false },
                { key: 'code', label: 'الكود', enabled: false }
            ])
        },
        // Table footer totals
        footerRows: {
            type: [{
                key: String,
                label: String,
                enabled: { type: Boolean, default: true }
            }],
            default: () => ([
                { key: 'subtotal', label: 'الإجمالي قبل الضريبة', enabled: true },
                { key: 'vat', label: 'القيمة المضافة 15%', enabled: true },
                { key: 'total', label: 'الإجمالي بعد الضريبة', enabled: true },
                { key: 'discount', label: 'الخصم', enabled: false },
                { key: 'paid', label: 'المدفوع', enabled: false },
                { key: 'remaining', label: 'المتبقي', enabled: false }
            ])
        }
    },

    // ─── Product Label specific ────────────────────────────────────
    label: {
        width: { type: Number, default: 40 },   // mm
        height: { type: Number, default: 22 },  // mm
        contentRows: {
            type: [rowSchema],
            default: () => ([
                { text: '{{product.name}}', format: { fontSize: 10 } },
                { text: '{{barcode_image}}', format: { fontSize: 10 } },
                { text: '{{barcode_text}}', format: { fontSize: 8 } },
                { text: '{{price}}', format: { fontSize: 10 } }
            ])
        }
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

templateSchema.index({ companyId: 1, type: 1 });
templateSchema.index({ companyId: 1, name: 1 });

const Template = mongoose.model('Template', templateSchema);
export default Template;
