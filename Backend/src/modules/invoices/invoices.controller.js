import { invoiceModel } from "./invoices.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const createInvoice = catchAsyncError(async (req, res, next) => {
    const existingInvoice = await invoiceModel.findOne({ invoiceNumber: req.body.invoiceNumber });
    if (existingInvoice) {
        return next(new AppError('Invoice number already exists', 409));
    }

    const invoice = new invoiceModel(req.body);
    await invoice.save();

    if (!invoice) {
        return next(new AppError('Invoice not created', 400));
    }

    res.status(201).json({ message: 'Invoice created successfully', invoice });
});

const getAllInvoices = catchAsyncError(async (req, res, next) => {
    const invoices = await invoiceModel.find().populate('customerId');
    res.status(200).json({ message: 'Invoices fetched successfully', invoices });
});

const getInvoiceById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const invoice = await invoiceModel.findById(id).populate('customerId');

    if (!invoice) {
        return next(new AppError('Invoice not found', 404));
    }

    res.status(200).json({ message: 'Invoice fetched successfully', invoice });
});

const updateInvoice = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    // Prevent updating invoiceNumber to a duplicate
    if (req.body.invoiceNumber) {
        const existingInvoice = await invoiceModel.findOne({ invoiceNumber: req.body.invoiceNumber, _id: { $ne: id } });
        if (existingInvoice) {
            return next(new AppError('Invoice number already exists', 409));
        }
    }

    const invoice = await invoiceModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!invoice) {
        return next(new AppError('Invoice not updated', 400));
    }

    res.status(200).json({ message: 'Invoice updated successfully', invoice });
});

const deleteInvoice = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const invoice = await invoiceModel.findByIdAndDelete(id);

    if (!invoice) {
        return next(new AppError('Invoice not deleted', 400));
    }

    res.status(200).json({ message: 'Invoice deleted successfully', invoice });
});

export { createInvoice, getAllInvoices, getInvoiceById, updateInvoice, deleteInvoice };