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
import { generatePDF } from "../../utils/generatePDF.js";

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

    const company = await companyModel.findById(transaction.companyId).select("name logo defaultCurrency commercial_register tax_number address").lean();
    const companyName = company?.name || "Company";
    const companyLogoUrl = company?.logo?.url;
    const currency = transaction.currency || company?.defaultCurrency || "EGP";
    const CURRENCY_SYMBOLS = { EGP: "ج.م", USD: "$", EUR: "€", SAR: "﷼", AED: "د.إ", GBP: "£" };
    const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

    // Build QR Payload
    const qrPayload = {
        invoiceNumber: transaction.transactionNumber,
        companyName,
        totalAmount: transaction.totalAmount,
        date: transaction.issueDate,
        invoiceId: transaction._id.toString()
    };
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), { width: 200, margin: 1 });

    const esc = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const fmt = (n) => Number(n ?? 0).toFixed(2);
    const contact = transaction.contactSnapshot || transaction.contact;
    const contactName = (contact?.name || transaction.contact?.name) || "—";
    
    // Build HTML Content
    const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${esc(transaction.transactionNumber)}</title>
    <style>
        @page { size: A4; margin: 0; }
        body {
            font-family: 'Cairo', 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
            line-height: 1.6;
            direction: rtl;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 20px;
        }
        .logo { max-width: 150px; max-height: 80px; }
        .company-info { text-align: left; }
        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: #1a56db;
            margin: 0 0 10px 0;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 30px;
        }
        .meta-table td { padding: 5px 0; }
        .billing-info {
            display: flex;
            gap: 40px;
            margin-bottom: 40px;
        }
        .billing-box { flex: 1; }
        .label {
            font-size: 10px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 5px;
            font-weight: bold;
        }
        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        table.items-table th {
            background-color: #f9fafb;
            color: #374151;
            text-align: right;
            padding: 12px;
            font-size: 12px;
            border-bottom: 2px solid #e5e7eb;
        }
        table.items-table td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 11px;
        }
        .summary {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .qr-code { width: 100px; height: 100px; }
        .totals-table { width: 250px; }
        .totals-table td { padding: 5px 0; text-align: left; }
        .totals-table td:first-child { text-align: right; color: #6b7280; }
        .totals-table .grand-total {
            font-size: 16px;
            font-weight: bold;
            color: #1a56db;
            border-top: 2px solid #e5e7eb;
            padding-top: 10px;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
            padding-top: 20px;
        }
        .arabic-text { direction: rtl; unicode-bidi: embed; }
        .number { direction: ltr; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-brand">
            ${companyLogoUrl ? `<img src="${companyLogoUrl}" class="logo" />` : `<h1 style="margin:0">${esc(companyName)}</h1>`}
        </div>
        <div class="company-info" style="text-align: right;">
            <p style="margin:0; font-weight:bold;">${esc(companyName)}</p>
            ${company.commercial_register ? `<p style="margin:2px 0; font-size:11px;">\u0633\u062c\u0644 \u062a\u062c\u0627\u0631\u064a: ${esc(company.commercial_register)}</p>` : ''}
            ${company.tax_number ? `<p style="margin:2px 0; font-size:11px;">\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064a\u0628\u064a: ${esc(company.tax_number)}</p>` : ''}
            ${company.address ? `<p style="margin:2px 0; font-size:11px;">${esc(company.address)}</p>` : ''}
        </div>
    </div>

    <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
        <div>
            <h2 class="invoice-title">${esc(docTypeLabel(transaction.module, transaction.documentType))}</h2>
            <p style="margin:0; font-weight:bold;"># ${esc(transaction.transactionNumber)}</p>
        </div>
        <div style="text-align: left;">
            <p style="margin:0; font-size:11px;"><span style="color:#6b7280;">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0635\u062f\u0627\u0631:</span> ${new Date(transaction.issueDate).toLocaleDateString('ar-SA')}</p>
            ${transaction.dueDate ? `<p style="margin:2px 0; font-size:11px;"><span style="color:#6b7280;">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642:</span> ${new Date(transaction.dueDate).toLocaleDateString('ar-SA')}</p>` : ''}
        </div>
    </div>

    <div class="billing-info">
        <div class="billing-box">
            <div class="label">\u0641\u0627\u062a\u0648\u0631\u0629 \u0625\u0644\u0649</div>
            <p style="margin:0; font-weight:bold;">${esc(contactName)}</p>
            <p style="margin:2px 0; font-size:11px;">${esc(contact?.address?.address1 || contact?.address?.city || "")}</p>
            ${contact?.phone ? `<p style="margin:2px 0; font-size:11px;">${esc(contact.phone)}</p>` : ''}
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">\u0627\u0644\u0648\u0635\u0641</th>
                <th style="text-align: center;">\u0627\u0644\u0643\u0645\u064a\u0629</th>
                <th style="text-align: center;">\u0627\u0644\u0633\u0639\u0631</th>
                <th style="text-align: left;">\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a</th>
            </tr>
        </thead>
        <tbody>
            ${(transaction.items || []).map(item => {
                const name = item.productName || item.product?.name || "—";
                const total = item.total ?? (item.quantity * item.unitPrice - (item.discountAmount || 0) + (item.taxAmount || 0));
                return `
                    <tr>
                        <td>${esc(name)}</td>
                        <td style="text-align: center;" class="number">${fmt(item.quantity)}</td>
                        <td style="text-align: center;" class="number">${fmt(item.unitPrice)}</td>
                        <td style="text-align: left;" class="number">${fmt(total)} ${esc(currencySymbol)}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    </table>

    <div class="summary">
        <div style="text-align: center;">
            <img src="${qrDataURL}" class="qr-code" />
            <p style="margin:5px 0 0 0; font-size:9px; color:#9ca3af;">\u0645\u0633\u062d \u0644\u0644\u062a\u062d\u0642\u0642</p>
        </div>
        <table class="totals-table">
            <tr>
                <td>\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0641\u0631\u0631\u0639\u064a:</td>
                <td class="number">${fmt(transaction.subtotal)} ${esc(currencySymbol)}</td>
            </tr>
            ${transaction.totalDiscount > 0 ? `
            <tr>
                <td>\u0627\u0644\u062e\u0635\u0645:</td>
                <td class="number">-${fmt(transaction.totalDiscount)} ${esc(currencySymbol)}</td>
            </tr>
            ` : ''}
            <tr>
                <td>\u0627\u0644\u0636\u0631\u064a\u0628\u0629:</td>
                <td class="number">${fmt(transaction.totalTax)} ${esc(currencySymbol)}</td>
            </tr>
            <tr class="grand-total">
                <td>\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0646\u0647\u0627\u0626\u064a:</td>
                <td class="number">${fmt(transaction.totalAmount)} ${esc(currencySymbol)}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>${esc(companyName)} — \u062c\u0645\u064a\u0631 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629</p>
        <p style="margin-top:5px; color:#e5e7eb;">Generated by Dafater Accounting</p>
    </div>
</body>
</html>
    `;

    const pdfBuffer = await generatePDF(htmlContent, {
        format: "A4",
        margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" }
    });

    const filename = `invoice-${(transaction.transactionNumber || id).replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
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
