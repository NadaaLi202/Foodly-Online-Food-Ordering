import { transferProcessModel } from "./transferProcess.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// ================== Add Transfer Process ==================
export const addTransferProcess = catchAsyncError(async (req, res, next) => {
    const { fromWarehouse, toWarehouse } = req.body;
    const process = new transferProcessModel(req.body);
    await process.save();

    res.status(201).json({
        message: "تم إضافة عملية التحويل بنجاح",
        process
    });
});

// ================== Get All ==================
export const getAllTransferProcesses = catchAsyncError(async (req, res) => {
    const processes = await transferProcessModel
        .find()
        .populate("operation")
        .populate("product")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب عمليات التحويل بنجاح",
        processes
    });
});

// ================== Get By ID ==================
export const getTransferProcessById = catchAsyncError(async (req, res, next) => {
    const process = await transferProcessModel
        .findById(req.params.id)
        .populate("operation")
        .populate("product");

    if (!process) {
        return next(
            new AppError("عملية التحويل غير موجودة", 404)
        );
    }

    res.status(200).json({
        message: "تم جلب عملية التحويل بنجاح",
        process
    });
});

// ================== Delete ==================
export const deleteTransferProcess = catchAsyncError(async (req, res, next) => {
    const process = await transferProcessModel.findByIdAndDelete(
        req.params.id
    );

    if (!process) {
        return next(
            new AppError("عملية التحويل غير موجودة", 404)
        );
    }

    res.status(200).json({
        message: "تم حذف عملية التحويل بنجاح",
        process
    });
});


export const updateTransferProcess = catchAsyncError(async (req, res, next) => {
    const process = await transferProcessModel.findByIdAndUpdate(
        req.params.id
    );

    if (!process) {
        return next(
            new AppError("عملية التحويل غير موجودة", 404)
        );
    }

    res.status(200).json({
        message: "تم تعديل عملية التحويل بنجاح",
        process
    });
});