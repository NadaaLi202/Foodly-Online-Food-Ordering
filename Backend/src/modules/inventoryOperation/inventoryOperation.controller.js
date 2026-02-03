import { inventoryOperationModel } from "./inventoryOperation.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// ================= Add =================
export const addInventoryOperation = catchAsyncError(async (req, res) => {
    const operation = new inventoryOperationModel(req.body);
    await operation.save();

    res.status(201).json({
        message: "تم إضافة عملية الجرد بنجاح",
        operation
    });
});

// ================= Get All =================
export const getAllInventoryOperations = catchAsyncError(async (req, res) => {
    const operations = await inventoryOperationModel
        .find()
        .populate("warehouse")
        .sort({ date: -1 });

    res.status(200).json({
        message: "تم جلب عمليات الجرد بنجاح",
        operations
    });
});

// ================= Get One =================
export const getInventoryOperationById = catchAsyncError(
    async (req, res, next) => {
        const operation = await inventoryOperationModel
            .findById(req.params.id)
            .populate("warehouse");

        if (!operation) {
            return next(new AppError("عملية الجرد غير موجودة", 404));
        }

        res.status(200).json({
            message: "تم جلب عملية الجرد بنجاح",
            operation
        });
    }
);

// ================= Update =================
export const updateInventoryOperation = catchAsyncError(
    async (req, res, next) => {
        const operation = await inventoryOperationModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!operation) {
            return next(new AppError("عملية الجرد غير موجودة", 404));
        }

        res.status(200).json({
            message: "تم تعديل عملية الجرد بنجاح",
            operation
        });
    }
);

// ================= Delete =================
export const deleteInventoryOperation = catchAsyncError(
    async (req, res, next) => {
        const operation = await inventoryOperationModel.findByIdAndDelete(
            req.params.id
        );

        if (!operation) {
            return next(new AppError("عملية الجرد غير موجودة", 404));
        }

        res.status(200).json({
            message: "تم حذف عملية الجرد بنجاح",
            operation
        });
    }
);
