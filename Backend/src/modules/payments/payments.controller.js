import Payment from "./payments.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// ========== ADD ==========
const addPayment = (module) =>
    catchAsyncError(async (req, res) => {
        const payment = await Payment.create({
            ...req.body,
            module,
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
        const payments = await Payment.find({
            module,
            deletedAt: null
        })
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
    const payment = await Payment.findById(req.params.id)
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
    const payment = await Payment.findById(req.params.id);

    if (!payment || payment.deletedAt) {
        return next(new AppError("غير موجود", 404));
    }

    Object.assign(payment, req.body);
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
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
        return next(new AppError("غير موجود", 404));
    }

    // payment.deletedAt = new Date();
    // payment.deletedBy = req.user?._id;
    // await payment.save();

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