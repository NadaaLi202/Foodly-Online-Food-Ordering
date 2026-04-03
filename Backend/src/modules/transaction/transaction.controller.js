import Transaction from "./transaction.model.js";
import Payment from "../payments/payments.model.js";
import mongoose from "mongoose";
import Contact from "../contacts/contacts.model.js";
import { companyModel } from "../companies/company.model.js";
import { SUPPORTED_CURRENCIES } from "../../constants/currencies.js";
import { resolveCompanyIdForWrite } from "../../middleware/applyCompanyFilter.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { processArabic } from "../../utils/arabic.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as inventoryService from "../product/inventory.service.js";
import logError from "../../utils/logError.js";
import { createInvoiceJournalEntry, createPaymentJournalEntry } from "./transaction.accounting.js";
import { createTransactionFromInvoice } from "../FinancialTransactions/services/accountingTransaction.service.js";

const docTypeLabel = (module, type) => {
    if (module === 'Purchases') return type === 'return' ? 'مرتجع مشتريات' : 'فاتورة مشتريات';
    return type === 'return' ? 'مرتجع مبيعات' : 'فاتورة ضريبية';
};

/**
 * Automates creation/update of payment records for sales and purchases invoices.
 */
const syncTransactionPayment = async (transaction, user, session = null) => {
    try {
        // Only for sales or purchases invoices
        if (transaction.documentType !== 'invoice') return null;
        if (transaction.module !== 'sales' && transaction.module !== 'purchases') return null;

        const isSales = transaction.module === 'sales';
        const paidAmount = Number(transaction.paidAmount || 0);

        // Find any existing automatic payment for this invoice
        let payment = await Payment.findOne({
            invoice: transaction._id,
            invoiceType: 'automatic',
            deletedAt: { $in: [null, undefined] }
        }).session(session);

        // If it's a draft or paidAmount is 0, delete any existing automatic payment
        if (transaction.status === 'draft' || paidAmount <= 0) {
            if (payment) {
                payment.deletedAt = new Date();
                payment.deletedBy = user?._id;
                await payment.save({ session });
            }
            return null;
        }

        // Create or Update
        const paymentData = {
            date: transaction.issueDate || new Date(),
            module: transaction.module,
            operationType: isSales ? 'receive' : 'spend',
            contact: transaction.contact,
            invoice: transaction._id,
            amount: paidAmount,
            treasury: transaction.payment?.treasury || 'main',
            referenceNumber: transaction.transactionNumber,
            invoiceType: 'automatic',
            status: 'completed',
            companyId: transaction.companyId,
            lastModifiedBy: user?._id
        };

        if (payment) {
            Object.assign(payment, paymentData);
            await payment.save({ session });
        } else {
            paymentData.createdBy = user?._id;
            const created = await Payment.create([paymentData], { session });
            payment = created[0];
        }

        // Handle Accounting
        const companyIdStr = transaction.companyId?.toString();
        if (companyIdStr) {
            createPaymentJournalEntry(payment, transaction, companyIdStr).catch(() => { });
        }

        return payment;
    } catch (err) {
        logError('[syncTransactionPayment] Error:', err);
        return null;
    }
};

const createTransaction = (module, documentType) =>
    catchAsyncError(async (req, res, next) => {
        console.log(`[DEBUG] createTransaction called for ${module}/${documentType}`);
        const opData = { ...req.body };
        if (typeof opData.payment === "string") {
            try {
                opData.payment = JSON.parse(opData.payment);
            } catch (e) {
                logError("Error parsing payment JSON:", e);
            }
        }
        let companyId = resolveCompanyIdForWrite(req);
        if (!companyId && opData.contact) {
            const contactDoc = await Contact.findById(opData.contact).select("companyId").lean();
            companyId = contactDoc?.companyId ? String(contactDoc.companyId) : null;
        }
        if (!companyId) {
            return next(new AppError("Unable to resolve company context for this transaction", 400));
        }
        const company = companyId ? await companyModel.findById(companyId).select("defaultCurrency").lean() : null;
        const defaultCurrency = company?.defaultCurrency || "EGP";
        const paymentCurrency = opData.payment?.currency;
        const normalizedCurrency = String(paymentCurrency || opData.currency || "").trim().toUpperCase();
        opData.currency = SUPPORTED_CURRENCIES.includes(normalizedCurrency) ? normalizedCurrency : defaultCurrency;

        // Check transactionNumber uniqueness per company
        if (opData.transactionNumber) {
            const existing = await Transaction.findOne({
                transactionNumber: opData.transactionNumber,
                companyId: companyId
            });
            if (existing) {
                return next(new AppError("رقم المعاملة موجود بالفعل", 409));
            }
        }

        // Handle file uploads
        if (req.files && req.files.attachments) {
            const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'transactions'));
            const results = await Promise.all(uploadPromises);
            opData.attachments = results.map((result, index) => ({
                fileName: req.files.attachments[index].originalname,
                fileUrl: result.secure_url,
                publicId: result.public_id,
                uploadedAt: new Date()
            }));
        }

        // Parse items if they are sent as a JSON string (using FormData)
        if (typeof opData.items === 'string') {
            try {
                opData.items = JSON.parse(opData.items);
            } catch (e) {
                logError("Error parsing items JSON:", e);
            }
        }

        const session = await mongoose.startSession();
        let txn;
        try {
            await session.withTransaction(async () => {
                const transaction = await Transaction.create([{
                    ...opData,
                    module,
                    documentType,
                    companyId,
                    createdBy: req.user?._id
                }], { session });

                txn = transaction[0];

                // Automated Stock Updates
                if (txn.status !== 'draft' && (txn.documentType === 'invoice' || txn.documentType === 'return')) {
                    const isSales = txn.module === 'sales';
                    const isReturn = txn.documentType === 'return';

                    const stockType = isSales ? (isReturn ? 'in' : 'out') : (isReturn ? 'out' : 'in');

                    for (const item of txn.items || []) {
                        await inventoryService.updateProductStock({
                            productId: item.product,
                            companyId,
                            quantity: item.quantity,
                            type: stockType,
                            permissionId: txn._id,
                            userId: req.user?._id,
                            purchasePrice: (txn.module === 'purchases' && txn.documentType === 'invoice') ? item.unitPrice : null,
                            session
                        });
                    }
                }
            });

            // Post-transaction syncs (non-fatal, outside retry loop)
            const payment = await syncTransactionPayment(txn, req.user).catch(() => null);

            // Accounting: Generate/Sync journal entry for all invoices/returns (non-draft)
            if (txn.documentType === 'invoice' || txn.documentType === 'return') {
                createInvoiceJournalEntry(txn, companyId).catch(() => { });
                if (txn.module === 'sales' && txn.documentType === 'invoice' && txn.status !== 'draft') {
                    createTransactionFromInvoice(txn).catch(() => { });
                }
            }

            res.status(201).json({
                message: "تم الإنشاء بنجاح",
                transaction: txn,
                paymentCreated: !!payment
            });
        } catch (error) {
            logError("Transaction failed:", error);
            next(error);
        } finally {
            await session.endSession();
        }
    });

const getAllTransactions = (module, documentType) =>
    catchAsyncError(async (req, res) => {
        const query = {
            module,
            documentType,
            deletedAt: { $eq: null },
            ...req.companyFilter
        };
        if (req.query.currency && SUPPORTED_CURRENCIES.includes(req.query.currency)) {
            query.currency = req.query.currency;
        }
        if (req.query.contactId) {
            query.contact = req.query.contactId;
        }
        if (req.query.dateFrom || req.query.dateTo) {
            query.issueDate = {};
            if (req.query.dateFrom) query.issueDate.$gte = new Date(req.query.dateFrom);
            if (req.query.dateTo) {
                const d = new Date(req.query.dateTo);
                d.setHours(23, 59, 59, 999);
                query.issueDate.$lte = d;
            }
        }
        if (req.query.amountMin != null || req.query.amountMax != null) {
            query.totalAmount = {};
            if (req.query.amountMin != null) query.totalAmount.$gte = parseFloat(req.query.amountMin);
            if (req.query.amountMax != null) query.totalAmount.$lte = parseFloat(req.query.amountMax);
        }
        if (req.query.search && req.query.search.trim()) {
            const searchTerm = req.query.search.trim();
            const contactType = module === 'sales' ? 'customer' : 'supplier';
            const contactFilter = { name: { $regex: searchTerm, $options: 'i' }, module: contactType, ...req.companyFilter };
            const matchingContacts = await Contact.find(contactFilter).select('_id').lean();
            const contactIds = matchingContacts.map(c => c._id);

            query.$or = [
                { transactionNumber: { $regex: searchTerm, $options: 'i' } }
            ];
            if (contactIds.length > 0) {
                query.$or.push({ contact: { $in: contactIds } });
            }
        }

        const data = await Transaction.find(query)
            .populate('contact', 'name email phone type')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ results: data.length, data });
    });

const getOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findOne({
        _id: req.params.id,
        deletedAt: { $in: [null, undefined] },
        ...req.companyFilter
    })
        .populate('contact', 'name email phone type address')
        .populate('items.product', 'name sellingPrice');
    if (!doc) return next(new AppError("غير موجود", 404));
    res.json(doc);
});

const updateOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!doc) return next(new AppError("غير موجود", 404));

    const opData = { ...req.body };
    if (typeof opData.payment === "string") {
        try {
            opData.payment = JSON.parse(opData.payment);
        } catch (e) {
            logError("Error parsing payment JSON:", e);
        }
    }
    const company = doc.companyId
        ? await companyModel.findById(doc.companyId).select("defaultCurrency").lean()
        : null;
    const defaultCurrency = company?.defaultCurrency || "EGP";
    if (Object.prototype.hasOwnProperty.call(opData, "currency") || opData.payment?.currency) {
        const normalizedCurrency = String(opData.payment?.currency || opData.currency || "").trim().toUpperCase();
        opData.currency = SUPPORTED_CURRENCIES.includes(normalizedCurrency) ? normalizedCurrency : defaultCurrency;
    }

    // Check transactionNumber uniqueness if changed
    if (opData.transactionNumber && opData.transactionNumber !== doc.transactionNumber) {
        const existing = await Transaction.findOne({
            transactionNumber: opData.transactionNumber,
            companyId: doc.companyId
        });
        if (existing) {
            return next(new AppError("رقم المعاملة موجود بالفعل", 409));
        }
    }

    // Handle file uploads
    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'transactions'));
        const results = await Promise.all(uploadPromises);
        const newAttachments = results.map((result, index) => ({
            fileName: req.files.attachments[index].originalname,
            fileUrl: result.secure_url,
            publicId: result.public_id,
            uploadedAt: new Date()
        }));
        doc.attachments = [...(doc.attachments || []), ...newAttachments];
    }

    // Handle attachment deletion: when opData.attachments is provided, delete from Cloudinary any removed ones
    if (opData.attachments && Array.isArray(opData.attachments)) {
        const existing = doc.attachments || [];
        const newById = new Set(opData.attachments.map(a => (a.publicId || a.fileUrl)).filter(Boolean));
        for (const a of existing) {
            const id = a.publicId || a.fileUrl;
            if (id && !newById.has(id)) {
                if (a.publicId) await deleteFromCloudinary(a.publicId);
            }
        }
    }

    // Parse items if they are sent as a JSON string
    if (typeof opData.items === 'string') {
        try {
            opData.items = JSON.parse(opData.items);
        } catch (e) {
            logError("Error parsing items JSON:", e);
        }
    }

    Object.assign(doc, opData);
    // Protect companyId
    if (req.companyFilter.companyId) {
        doc.companyId = req.companyFilter.companyId;
    }
    doc.lastModifiedBy = req.user?._id;

    await doc.save(); // ✅ يشغّل pre('save')

    // Sync automatic payment
    const payment = await syncTransactionPayment(doc, req.user);
    // Accounting: Sync journal entry
    if (doc.documentType === 'invoice' || doc.documentType === 'return') {
        createInvoiceJournalEntry(doc, doc.companyId).catch(() => { });
        if (doc.module === 'sales' && doc.documentType === 'invoice' && doc.status !== 'draft') {
            createTransactionFromInvoice(doc).catch(() => { });
        }
    }

    res.json({
        message: "تم التعديل بنجاح",
        data: doc,
        paymentCreated: !!payment
    });
});

const deleteOne = catchAsyncError(async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const doc = await Transaction.findById(req.params.id).session(session);
            if (!doc) throw new AppError("المعاملة غير موجودة", 404);

            // Reverse Stock before deleting
            if (doc.status !== 'draft' && (doc.documentType === 'invoice' || doc.documentType === 'return')) {
                const isSales = doc.module === 'sales';
                const isReturn = doc.documentType === 'return';
                // Reversing: Sales Invoice OUT becomes IN
                // Corrected logic based on existing code:
                for (const item of doc.items || []) {
                    const action = (doc.module === 'purchases' && doc.documentType === 'invoice') || (doc.module === 'sales' && doc.documentType === 'return') ? 'subtract' : 'add';

                    await inventoryService.updateProductStock({
                        productId: item.product,
                        companyId: String(doc.companyId),
                        quantity: item.quantity,
                        type: action === 'add' ? 'in' : 'out',
                        permissionId: doc._id,
                        userId: req.user?._id,
                        session
                    });
                }
            }

            doc.deletedAt = new Date();
            doc.deletedBy = req.user?._id;
            await doc.save({ session });

            // Delete linked automatic payments
            await Payment.deleteMany({
                invoice: doc._id,
                invoiceType: 'automatic'
            }, { session });

            // Delete linked journal entry
            await deleteInvoiceJournalEntry(doc.transactionNumber, doc.companyId);
        });

        res.json({ message: "تم الحذف" });
    } catch (error) {
        logError("Delete transaction error:", error);
        next(error);
    } finally {
        await session.endSession();
    }
});

const generateTransactionPDF = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const baseQuery = { _id: id, deletedAt: { $in: [null, undefined] } };
    // Company-scoped: same as getOne; superAdmin can fallback without filter
    let transaction = await Transaction.findOne({ ...baseQuery, ...req.companyFilter })
        .populate("contact", "name email phone type address")
        .populate("items.product", "name sellingPrice")
        .lean();
    if (!transaction && req.user?.role === "superAdmin") {
        transaction = await Transaction.findOne(baseQuery)
            .populate("contact", "name email phone type address")
            .populate("items.product", "name sellingPrice")
            .lean();
    }
    if (!transaction) return next(new AppError("Document not found", 404));

    // Set headers only; do not send JSON — pipe PDF stream to res
    const company = await companyModel.findById(transaction.companyId).select("name logo defaultCurrency").lean();
    const companyName = company?.name || "Company";
    const companyLogoUrl = company?.logo?.url;
    const currency = transaction.currency || company?.defaultCurrency || "EGP";
    const CURRENCY_SYMBOLS = { EGP: "ج.م", USD: "$", EUR: "€", SAR: "﷼", AED: "د.إ", GBP: "£" };
    const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

    const qrPayload = {
        invoiceNumber: transaction.transactionNumber,
        companyName,
        totalAmount: transaction.totalAmount,
        date: transaction.issueDate,
        invoiceId: transaction._id.toString()
    };
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), { width: 200, margin: 1 });

    let logoBuffer = null;
    if (companyLogoUrl) {
        try {
            const response = await fetch(companyLogoUrl);
            const arrayBuffer = await response.arrayBuffer();
            logoBuffer = Buffer.from(arrayBuffer);
        } catch (e) {
            console.error("Failed to fetch logo:", e.message);
        }
    }

    const filename = `invoice-${(transaction.transactionNumber || id).replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: "A4", margin: 40, rtl: true });
    const regularFontPath = path.join(__dirname, "../../assets/fonts/Arial-Regular.ttf");
    const boldFontPath = path.join(__dirname, "../../assets/fonts/Arial-Bold.ttf");
    doc.registerFont("ArabicFont", regularFontPath);
    doc.registerFont("ArabicFontBold", boldFontPath);
    doc.font("ArabicFont"); // Set default font

    doc.pipe(res);

    let y = 40;
    const pageWidth = doc.page.width - 80;
    const rightCol = 350;

    if (logoBuffer) {
        try {
            doc.image(logoBuffer, 40, y, { width: 50, height: 50 });
        } catch (e) {
            // if image load fails, skip
        }
        y += 55;
    }
    doc.fontSize(18).font("ArabicFontBold").text(processArabic(companyName), 40, y, { width: pageWidth, align: "right" });
    y += 28;
    doc.fontSize(10).font("ArabicFont").text(processArabic(docTypeLabel(transaction.module, transaction.documentType)), 40, y, { width: pageWidth, align: "right" });
    doc.fontSize(12).text(`# ${transaction.transactionNumber}`, rightCol, y);
    y += 20;
    doc.fontSize(9).text(`Issue: ${new Date(transaction.issueDate).toLocaleDateString()}`, rightCol, y);
    doc.text(`Due: ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : "—"}`, rightCol, y + 14);
    y += 40;

    const contact = transaction.contactSnapshot || transaction.contact;
    const contactName = (contact?.name || transaction.contact?.name) || "—";
    const contactAddr = contact?.address ? (contact.address.address1 || contact.address.city || "") : "";
    doc.fontSize(10).font("ArabicFontBold").text(processArabic("فاتورة إلى"), 40, y, { width: pageWidth, align: "right" });
    y += 16;
    doc.font("ArabicFont").text(processArabic(contactName), 40, y, { width: pageWidth, align: "right" });
    if (contactAddr) doc.text(processArabic(contactAddr), 40, y + 14, { width: pageWidth, align: "right" });
    y += 36;

    doc.fontSize(9).font("ArabicFontBold");
    doc.text(processArabic("المنتج"), 40, y, { width: 170, align: "right" });
    doc.text(processArabic("الكمية"), 220, y, { width: 40, align: "right" });
    doc.text(processArabic("السعر"), 260, y, { width: 50, align: "right" });
    doc.text(processArabic("الإجمالي"), 320, y, { width: pageWidth - 280, align: "right" });
    y += 18;
    doc.moveTo(40, y).lineTo(pageWidth + 40, y).stroke();
    y += 10;

    doc.font("ArabicFont");
    const fmt = (n) => Number(n ?? 0).toFixed(2);
    (transaction.items || []).forEach((item) => {
        const name = item.productName || item.product?.name || "—";
        const total = item.total ?? (item.quantity * item.unitPrice - (item.discountAmount || 0) + (item.taxAmount || 0));
        doc.fontSize(9).text(processArabic(name.substring(0, 35)), 40, y, { width: 170, align: "right" });
        doc.text(fmt(item.quantity), 210, y, { width: 40, align: "right" });
        doc.text(fmt(item.unitPrice), 250, y, { width: 60, align: "right" });
        doc.text(`${fmt(total)} ${processArabic(currencySymbol)}`, 310, y, { width: pageWidth - 270, align: "right" });
        y += 18;
    });
    y += 12;

    doc.moveTo(40, y).lineTo(pageWidth + 40, y).stroke();
    y += 16;
    doc.font("ArabicFontBold").text(processArabic("الإجمالي الفرعي:"), 260, y, { width: 80, align: "right" });
    doc.text(`${fmt(transaction.subtotal)} ${processArabic(currencySymbol)}`, 350, y, { width: pageWidth - 310, align: "right" });
    y += 14;
    if (transaction.totalDiscount > 0) {
        doc.text(processArabic("الخصم:"), 260, y, { width: 80, align: "right" });
        doc.text(`-${fmt(transaction.totalDiscount)} ${processArabic(currencySymbol)}`, 350, y, { width: pageWidth - 310, align: "right" });
        y += 14;
    }
    doc.font("ArabicFontBold").text(processArabic("الضريبة:"), 260, y, { width: 80, align: "right" });
    doc.font("ArabicFont").text(`${fmt(transaction.totalTax)} ${processArabic(currencySymbol)}`, 350, y, { width: pageWidth - 310, align: "right" });
    y += 14;
    doc.font("ArabicFontBold").fontSize(11).text(processArabic("الإجمالي النهائي:"), 260, y, { width: 80, align: "right" });
    doc.font("ArabicFont").text(`${fmt(transaction.totalAmount)} ${processArabic(currencySymbol)}`, 350, y, { width: pageWidth - 310, align: "right" });
    y += 28;

    const qrBase64 = qrDataURL.replace(/^data:image\/\w+;base64,/, "");
    const qrBuffer = Buffer.from(qrBase64, "base64");
    doc.image(qrBuffer, pageWidth + 40 - 80, y, { width: 80, height: 80 });
    doc.fontSize(8).font("ArabicFont").text(processArabic("التحقق من المستند عبر رمز QR"), pageWidth + 40 - 80, y + 84, { width: 80, align: "right" });

    doc.fontSize(8).text(`${companyName} — ${transaction.transactionNumber}`, 40, doc.page.height - 40);
    doc.end();
});

/** Alias for PDF download (invoice/transaction); used by route GET /:id/download */
const downloadInvoicePDF = generateTransactionPDF;

export {
    createTransaction,
    getAllTransactions,
    getOne,
    updateOne,
    deleteOne,
    generateTransactionPDF,
    downloadInvoicePDF
};
