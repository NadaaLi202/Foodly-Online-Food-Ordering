import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { operationModel } from "./operations.model.js";

// Add
export const addOperation = catchAsyncError(async (req, res) => {
    const operation = new operationModel(req.body);
    await operation.save();

    res.status(201).json({
        message: "تم إضافة العملية بنجاح",
        operation
    });
});

// Get All
export const getAllOperations = catchAsyncError(async (req, res) => {
    const operations = await operationModel.find().sort({ createdAt: -1 });

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

    const operation = await operationModel.findByIdAndUpdate(
        id,
        req.body,
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
