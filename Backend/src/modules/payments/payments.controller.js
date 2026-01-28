import { paymentModel } from "./payments.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addPayment = catchAsyncError(async (req, res, next) => {
    const payment = new paymentModel(req.body);
    await payment.save();

    if (!payment) {
        return next(new AppError('Payment not added', 400));
    }

    res.status(201).json({ message: 'Payment added successfully', payment });
});

const getAllPayments = catchAsyncError(async (req, res, next) => {
    const payments = await paymentModel.find().populate('invoice'); // Ensure Invoice ref is correct
    res.status(200).json({ message: 'Payments fetched successfully', payments });
});

const getPaymentById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const payment = await paymentModel.findById(id).populate('invoice');

    if (!payment) {
        return next(new AppError('Payment not found', 404));
    }

    res.status(200).json({ message: 'Payment fetched successfully', payment });
});

const updatePayment = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const payment = await paymentModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!payment) {
        return next(new AppError('Payment not updated', 400));
    }

    res.status(200).json({ message: 'Payment updated successfully', payment });
});

const deletePayment = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const payment = await paymentModel.findByIdAndDelete(id);

    if (!payment) {
        return next(new AppError('Payment not deleted', 400));
    }

    res.status(200).json({ message: 'Payment deleted successfully', payment });
});

export { addPayment, getAllPayments, getPaymentById, updatePayment, deletePayment };
