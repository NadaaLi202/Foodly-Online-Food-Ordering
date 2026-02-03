import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { operationModel } from "./operations.model.js";

// Add
export const addOperation = catchAsyncError(async (req, res) => {
    const opData = { ...req.body };
    if (req.files && req.files.length > 0) {
        opData.attachments = req.files.map(file => `/uploads/products/${file.filename}`);
    }
    const operation = new operationModel(opData);
    await operation.save();

    res.status(201).json({
        message: "تم إضافة العملية بنجاح",
        operation
    });
});

// Get All
export const getAllOperations = catchAsyncError(async (req, res) => {
    const operations = await operationModel.find().populate("warehouse").sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب العمليات بنجاح",
        operations
    });
});

// Get By ID
export const getOperationById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const operation = await operationModel.findById(id);
    if (!operation) {
        return next(new AppError("العملية غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم جلب العملية بنجاح",
        operation
    });
});

// Update
export const updateOperation = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const updateData = { ...req.body };
    if (req.files && req.files.length > 0) {
        updateData.attachments = req.files.map(file => `/uploads/products/${file.filename}`);
    }
    const operation = await operationModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    );

    if (!operation) {
        return next(new AppError("العملية غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم تحديث العملية بنجاح",
        operation
    });
});

// Delete
export const deleteOperation = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const operation = await operationModel.findByIdAndDelete(id);
    if (!operation) {
        return next(new AppError("العملية غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم حذف العملية بنجاح",
        operation
    });
});
