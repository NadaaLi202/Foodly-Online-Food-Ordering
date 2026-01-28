import { salesModel } from "./sales.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const createSale = catchAsyncError(async (req, res, next) => {
    const existingSale = await salesModel.findOne({ saleNumber: req.body.saleNumber });
    if (existingSale) {
        return next(new AppError('Sale number already exists', 409));
    }

    const sale = new salesModel(req.body);
    await sale.save();

    if (!sale) {
        return next(new AppError('Sale not created', 400));
    }

    res.status(201).json({ message: 'Sale created successfully', sale });
});

const getAllSales = catchAsyncError(async (req, res, next) => {
    const sales = await salesModel.find()
        .populate('customerId')
        .populate('items.productId')
        .populate('invoiceId')
        .populate('quoteId')
        .populate('payments')
        .populate('returnId');
    res.status(200).json({ message: 'Sales fetched successfully', sales });
});

const getSaleById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const sale = await salesModel.findById(id)
        .populate('customerId')
        .populate('items.productId')
        .populate('invoiceId')
        .populate('quoteId')
        .populate('payments')
        .populate('returnId');

    if (!sale) {
        return next(new AppError('Sale not found', 404));
    }

    res.status(200).json({ message: 'Sale fetched successfully', sale });
});

const updateSale = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    // Check for unique saleNumber if it's being updated
    if (req.body.saleNumber) {
        const existingSale = await salesModel.findOne({ saleNumber: req.body.saleNumber, _id: { $ne: id } });
        if (existingSale) {
            return next(new AppError('Sale number already exists', 409));
        }
    }

    const sale = await salesModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!sale) {
        return next(new AppError('Sale not updated', 400));
    }

    res.status(200).json({ message: 'Sale updated successfully', sale });
});

const deleteSale = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const sale = await salesModel.findByIdAndDelete(id);

    if (!sale) {
        return next(new AppError('Sale not deleted', 400));
    }

    res.status(200).json({ message: 'Sale deleted successfully', sale });
});

export { createSale, getAllSales, getSaleById, updateSale, deleteSale };
