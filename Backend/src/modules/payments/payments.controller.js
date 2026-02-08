import Payment from "./payments.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// ========== ADD ==========
const addPayment = (module) =>
    catchAsyncError(async (req, res, next) => {
        // req.body.companyId is set by middleware (or required for superAdmin)

        const payment = await Payment.create({
            ...req.body,
            module,
            companyId: req.body.companyId,
            createdBy: req.user?._id
        });

        await payment.populate('contact', 'name email phone');
        await payment.populate('invoice', 'transactionNumber totalAmount');

        res.status(201).json({
            message: "تم الإنشاء بنجاح",
            payment
        });
    });

// ========== GET ALL ==========
const getAllPayments = (module) =>
    catchAsyncError(async (req, res) => {
        let query = {
            module,
            deletedAt: null,
            ...req.companyFilter
        };

        const payments = await Payment.find(query)
            .populate('contact', 'name email phone')
            .populate('invoice', 'transactionNumber totalAmount')
            .sort({ date: -1 });

        res.json({
            message: "تم جلب البيانات بنجاح",
            count: payments.length,
            payments
        });
    });

// ========== GET ONE ==========
const getPaymentById = catchAsyncError(async (req, res, next) => {
    const payment = await Payment.findOne({ _id: req.params.id, ...req.companyFilter })
        .populate('contact', 'name email phone')
        .populate('invoice', 'transactionNumber totalAmount');

    if (!payment || payment.deletedAt) {
        return next(new AppError("غير موجود", 404));
    }

    res.json({
        message: "تم جلب البيانات بنجاح",
        payment
    });
});

// ========== UPDATE ==========
const updatePayment = catchAsyncError(async (req, res, next) => {
    const payment = await Payment.findOne({ _id: req.params.id, ...req.companyFilter });

    if (!payment || payment.deletedAt) {
        return next(new AppError("غير موجود", 404));
    }

    Object.assign(payment, req.body);
    // Ensure companyId isn't changed if present in body?
    // Middleware might set it again, or we can just ignore it since Object.assign overwrites.
    // Ideally we should prevent changing companyId unless superAdmin, but usually updates don't change tenant.
    if (req.companyFilter.companyId) {
        payment.companyId = req.companyFilter.companyId;
    }

    payment.lastModifiedBy = req.user?._id;

    await payment.save();
    await payment.populate('contact', 'name email phone');
    await payment.populate('invoice', 'transactionNumber totalAmount');

    res.json({
        message: "تم التعديل بنجاح",
        payment
    });
});

// ========== DELETE ==========
const deletePayment = catchAsyncError(async (req, res, next) => {
    const payment = await Payment.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });

    if (!payment) {
        return next(new AppError("غير موجود", 404));
    }

    res.json({
        message: "تم الحذف بنجاح",
        payment
    });
});

export {
    addPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment
};