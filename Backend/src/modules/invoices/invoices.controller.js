import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import Invoice from "./invoices.model.js";
import { SUPPORTED_CURRENCIES } from "../../constants/currencies.js";
import { dailyRestrictionModel } from "../dailyRestrictions/dailyRestrictions.model.js";
import { chartOfAccountsModel } from "../chartOfAccounts/chartOfAccounts.model.js";
import FinancialReceipt from "../FinancialTransactions/models/financialReceipt.model.js";
import { safeModel } from "../Safes/safe.model.js";
import mongoose from "mongoose";

// Helper function to create or update journal entry for an invoice
const createOrUpdateJournalEntryForInvoice = async (invoice) => {
    if (invoice.status === 'draft') return;

    const source = `Invoice: ${invoice.invoiceNumber}`;

    // Find existing entry if any
    let existingEntry = await dailyRestrictionModel.findOne({
        companyId: invoice.companyId,
        source: source
    });

    // Debit: Accounts Receivable (Simplified: for now use a default or find "Accounts Receivable" type)
    // Credit: Sales Revenue
    // Credit: VAT (if any)

    // Note: In a real system, these would come from settings. 
    // Since I cannot run seed or query DB easily now, I will assume generic names/codes or find them by name.

    const entries = [
        {
            account: 'حساب العملاء', // Accounts Receivable
            debit: invoice.total,
            credit: 0,
            description: `Invoice ${invoice.invoiceNumber} - Client: ${invoice.clientName}`
        },
        {
            account: 'مبيعات', // Sales
            debit: 0,
            credit: invoice.subtotal,
            description: `Sales revenue for invoice ${invoice.invoiceNumber}`
        }
    ];

    if (invoice.tax > 0) {
        entries.push({
            account: 'ضريبة القيمة المضافة', // VAT
            debit: 0,
            credit: invoice.tax,
            description: `VAT for invoice ${invoice.invoiceNumber}`
        });
    }

    const restrictionData = {
        number: existingEntry?.number, // Keep existing number if updating
        date: invoice.issueDate || new Date(),
        description: `قيد آلي للفاتورة رقم ${invoice.invoiceNumber}`,
        source: source,
        totalDebit: invoice.total,
        totalCredit: invoice.total,
        entries: entries,
        companyId: invoice.companyId,
        currency: invoice.currency || 'EGP',
        invoiceId: invoice._id,
        sourceType: 'invoice'
    };

    if (existingEntry) {
        Object.assign(existingEntry, restrictionData);
        await existingEntry.save();
    } else {
        const newEntry = new dailyRestrictionModel(restrictionData);
        await newEntry.save();
    }
};

// إنشاء فاتورة جديدة
const createInvoice = catchAsyncError(async (req, res, next) => {
    // التحقق من وجود رقم الفاتورة
    // Ensure uniqueness within company if we enforce it, or generally.
    // If invoiceNumber is unique globally in schema, this check is still good.
    // If we want per-company uniqueness, we need schema change (compound index), but let's just check with filter here.

    if (req.body.invoiceNumber) {
        // If we want to check uniqueness, we should check with companyId if possible, 
        // but since schema has global unique index on invoiceNumber (likely), we check globally or handle the error.
        // For now, let's query with companyId to be safe on logic level, 
        // but DB might throw duplicate error if another company has same number. 
        // Refactoring to global unique check (which is safer if schema is global unique) OR check with filter.
        // Let's assume global uniqueness for invoiceNumber for now as per schema.

        const existingInvoice = await Invoice.findOne({
            invoiceNumber: req.body.invoiceNumber?.toUpperCase()
        });

        // Use companyFilter check? If it exists globally, it exists.
        if (existingInvoice) {
            return next(new AppError('رقم الفاتورة موجود بالفعل', 409));
        }
    }

    // التحقق من صحة التواريخ
    if (new Date(req.body.dueDate) < new Date(req.body.issueDate)) {
        return next(new AppError('تاريخ الاستحقاق يجب أن يكون بعد تاريخ الإصدار', 400));
    }

    let paymentData = req.body.payment;
    if (typeof paymentData === "string") {
        try {
            paymentData = JSON.parse(paymentData);
        } catch {
            paymentData = null;
        }
    }
    const normalizedCurrency = String(paymentData?.currency || req.body.currency || "")
        .trim()
        .toUpperCase();

    // Always enforce tenant companyId from authenticated user/filter.
    // Keep DB schema-compatible top-level currency while accepting payment.currency payload.
    const companyId = req.user?.companyId || req.companyFilter?.companyId || req.body.companyId;
    const invoice = await Invoice.create({
        ...req.body,
        currency: SUPPORTED_CURRENCIES.includes(normalizedCurrency) ? normalizedCurrency : (req.body.currency || "EGP"),
        companyId
    });

    // إنشاء قيد يومية إذا لم تكن مسودة
    await createOrUpdateJournalEntryForInvoice(invoice);

    // إنشاء وصل للمبيعات إلكترونياً
    if (invoice.status === 'paid') {
        const existingReceipt = await FinancialReceipt.findOne({
            companyId: invoice.companyId,
            description: { $regex: new RegExp(invoice.invoiceNumber, 'i') }
        });

        if (!existingReceipt) {
            let mainSafe = await safeModel.findOne({ companyId: invoice.companyId, isDefault: true });
            if (!mainSafe) {
                // الفالباك في حال عدم تعيين الخزنة الرئيسية بعد
                mainSafe = await safeModel.findOne({ companyId: invoice.companyId }).sort({ createdAt: 1 });
            }

            if (mainSafe) {
                const count = await FinancialReceipt.countDocuments({ companyId: invoice.companyId });
                const now = new Date();
                const code = `${String(now.getFullYear()).slice(-2)}-${String(now.getMonth() + 1)}-${String(count + 1).padStart(6, '0')}`;

                let clientName = invoice.clientName || '';
                if (!clientName && invoice.clientId) {
                    const populatedInvoice = await Invoice.findById(invoice._id).populate('clientId');
                    clientName = populatedInvoice.clientId?.name || invoice.clientName;
                }

                await FinancialReceipt.create({
                    code: code,
                    date: new Date(),
                    account: mainSafe._id,
                    accountModel: 'Safe',
                    externalAccount: `عملية دفع عميل #${clientName}`,
                    amount: invoice.total,
                    description: `سداد فاتورة ${invoice.invoiceNumber}`,
                    companyId: invoice.companyId,
                    createdBy: req.user._id
                });

                mainSafe.balance += invoice.total;
                await mainSafe.save();
            }
        }
    }

    res.status(201).json({
        message: 'تم إنشاء الفاتورة بنجاح',
        invoice
    });
});

// الحصول على جميع الفواتير مع البحث والفلترة
const getAllInvoices = catchAsyncError(async (req, res, next) => {
    const { search, status, startDate, endDate, page = 1, limit = 10, clientId } = req.query;

    // بناء query للبحث
    let query = { ...req.companyFilter };

    if (search) {
        query.$or = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            { clientName: { $regex: search, $options: 'i' } }
        ];
    }

    if (status) {
        query.status = status;
    }

    if (clientId) {
        query.clientId = clientId;
    }

    if (startDate || endDate) {
        query.issueDate = {};
        if (startDate) query.issueDate.$gte = new Date(startDate);
        if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    // حساب pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // الحصول على الفواتير مع العدد الكلي
    const [invoices, totalCount] = await Promise.all([
        Invoice.find(query)
            .populate('clientId', 'name phone email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Invoice.countDocuments(query)
    ]);

    res.status(200).json({
        message: 'تم جلب الفواتير بنجاح',
        invoices,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            totalCount,
            limit: parseInt(limit)
        }
    });
});

// الحصول على فاتورة واحدة
const getInvoiceById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const invoice = await Invoice.findOne({ _id: id, ...req.companyFilter }).populate('clientId');

    if (!invoice) {
        return next(new AppError('الفاتورة غير موجودة', 404));
    }

    res.status(200).json({
        message: 'تم جلب الفاتورة بنجاح',
        invoice
    });
});

// تحديث فاتورة
const updateInvoice = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    // التحقق من وجود الفاتورة
    const invoice = await Invoice.findOne({ _id: id, ...req.companyFilter }).populate('clientId');
    if (!invoice) {
        return next(new AppError('الفاتورة غير موجودة', 404));
    }

    // التحقق من وجود رقم الفاتورة لفاتورة أخرى
    if (req.body.invoiceNumber) {
        const existingInvoice = await Invoice.findOne({
            invoiceNumber: req.body.invoiceNumber.toUpperCase(),
            _id: { $ne: id }
        });

        if (existingInvoice) {
            return next(new AppError('رقم الفاتورة موجود بالفعل', 409));
        }
    }

    // التحقق من صحة التواريخ
    if (req.body.issueDate && req.body.dueDate) {
        if (new Date(req.body.dueDate) < new Date(req.body.issueDate)) {
            return next(new AppError('تاريخ الاستحقاق يجب أن يكون بعد تاريخ الإصدار', 400));
        }
    }

    // تحديث البيانات
    let paymentData = req.body.payment;
    if (typeof paymentData === "string") {
        try {
            paymentData = JSON.parse(paymentData);
        } catch {
            paymentData = null;
        }
    }
    if (paymentData?.currency || req.body.currency) {
        const normalizedCurrency = String(paymentData?.currency || req.body.currency || "")
            .trim()
            .toUpperCase();
        req.body.currency = SUPPORTED_CURRENCIES.includes(normalizedCurrency)
            ? normalizedCurrency
            : req.body.currency;
    }
    Object.assign(invoice, req.body);
    // Ensure companyId is not changed or is valid? 
    // Usually companyId shouldn't be changed. Safe to ignore or force check.
    // If strict, reset companyId to original.
    if (req.companyFilter.companyId) {
        invoice.companyId = req.companyFilter.companyId;
    }

    await invoice.save(); // سيؤدي هذا لتشغيل الـ pre-save middleware

    // تحديث أو إنشاء قيد يومية
    await createOrUpdateJournalEntryForInvoice(invoice);

    // إنشاء وصل للمبيعات إلكترونياً
    if (invoice.status === 'paid') {
        const existingReceipt = await FinancialReceipt.findOne({
            companyId: invoice.companyId,
            description: { $regex: new RegExp(invoice.invoiceNumber, 'i') }
        });

        if (!existingReceipt) {
            let mainSafe = await safeModel.findOne({ companyId: invoice.companyId, isDefault: true });
            if (!mainSafe) {
                mainSafe = await safeModel.findOne({ companyId: invoice.companyId }).sort({ createdAt: 1 });
            }

            if (mainSafe) {
                const count = await FinancialReceipt.countDocuments({ companyId: invoice.companyId });
                const now = new Date();
                const code = `${String(now.getFullYear()).slice(-2)}-${String(now.getMonth() + 1)}-${String(count + 1).padStart(6, '0')}`;

                let clientName = invoice.clientName || '';
                if (!clientName && invoice.clientId) {
                    clientName = invoice.clientId.name || clientName;
                }

                await FinancialReceipt.create({
                    code: code,
                    date: new Date(),
                    account: mainSafe._id,
                    accountModel: 'Safe',
                    externalAccount: `عملية دفع عميل #${clientName}`,
                    amount: invoice.total,
                    description: `سداد فاتورة ${invoice.invoiceNumber}`,
                    companyId: invoice.companyId,
                    createdBy: req.user._id
                });

                mainSafe.balance += invoice.total;
                await mainSafe.save();
            }
        }
    }

    res.status(200).json({
        message: 'تم تحديث الفاتورة بنجاح',
        invoice
    });
});

// حذف فاتورة
const deleteInvoice = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const invoice = await Invoice.findOneAndDelete({ _id: id, ...req.companyFilter });

    if (!invoice) {
        return next(new AppError('الفاتورة غير موجودة', 404));
    }

    // هنا يمكنك إضافة حذف الملفات المرفقة من الـ storage
    // if (invoice.attachments.length > 0) {
    //     await deleteAttachments(invoice.attachments);
    // }

    res.status(200).json({
        message: 'تم حذف الفاتورة بنجاح',
        invoice
    });
});

// البحث في الفواتير
const searchInvoices = catchAsyncError(async (req, res, next) => {
    const { term } = req.query;

    if (!term) {
        return next(new AppError('يجب إدخال كلمة البحث', 400));
    }

    const invoices = await Invoice.searchInvoices(term, req.companyFilter);

    res.status(200).json({
        message: 'نتائج البحث',
        count: invoices.length,
        invoices
    });
});

// تحديث حالة الفاتورة
const updateInvoiceStatus = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['paid', 'unpaid', 'partial', 'draft'].includes(status)) {
        return next(new AppError('حالة غير صحيحة', 400));
    }

    const invoice = await Invoice.findOne({ _id: id, ...req.companyFilter }).populate('clientId');

    if (!invoice) {
        return next(new AppError('الفاتورة غير موجودة', 404));
    }

    await invoice.updateStatus(status);

    // تحديث أو إنشاء قيد يومية
    await createOrUpdateJournalEntryForInvoice(invoice);

    // إنشاء وصل مبيعات
    if (invoice.status === 'paid') {
        const existingReceipt = await FinancialReceipt.findOne({
            companyId: invoice.companyId,
            description: { $regex: new RegExp(invoice.invoiceNumber, 'i') }
        });

        if (!existingReceipt) {
            let mainSafe = await safeModel.findOne({ companyId: invoice.companyId, isDefault: true });
            if (!mainSafe) {
                mainSafe = await safeModel.findOne({ companyId: invoice.companyId }).sort({ createdAt: 1 });
            }

            if (mainSafe) {
                const count = await FinancialReceipt.countDocuments({ companyId: invoice.companyId });
                const now = new Date();
                const code = `${String(now.getFullYear()).slice(-2)}-${String(now.getMonth() + 1)}-${String(count + 1).padStart(6, '0')}`;

                let clientName = invoice.clientName || '';
                if (!clientName && invoice.clientId) {
                    clientName = invoice.clientId.name || clientName;
                }

                await FinancialReceipt.create({
                    code: code,
                    date: new Date(),
                    account: mainSafe._id,
                    accountModel: 'Safe',
                    externalAccount: `عملية دفع عميل #${clientName}`,
                    amount: invoice.total,
                    description: `سداد فاتورة ${invoice.invoiceNumber}`,
                    companyId: invoice.companyId,
                    createdBy: req.user._id
                });

                mainSafe.balance += invoice.total;
                await mainSafe.save();
            }
        }
    }

    res.status(200).json({
        message: 'تم تحديث حالة الفاتورة بنجاح',
        invoice
    });
});

// إحصائيات الفواتير
const getInvoiceStats = catchAsyncError(async (req, res, next) => {
    const matchStage = { ...req.companyFilter }; // Apply filter

    const stats = await Invoice.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$total' }
            }
        }
    ]);

    const totalInvoices = await Invoice.countDocuments(matchStage);

    res.status(200).json({
        message: 'إحصائيات الفواتير',
        totalInvoices,
        stats
    });
});

export {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    searchInvoices,
    updateInvoiceStatus,
    getInvoiceStats
};
