import { warehouseModel } from "./warehouse.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// ================= Add =================
export const addWarehouse = catchAsyncError(async (req, res) => {
    const warehouse = new warehouseModel(req.body);
    await warehouse.save();

    res.status(201).json({
        message: "تم إضافة المستودع بنجاح",
        warehouse
    });
});

// ================= Get All =================
export const getAllWarehouses = catchAsyncError(async (req, res) => {
    const warehouses = await warehouseModel
        .find()
        .populate("users")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب المستودعات بنجاح",
        warehouses
    });
});

// ================= Get One =================
export const getWarehouseById = catchAsyncError(async (req, res, next) => {
    const warehouse = await warehouseModel
        .findById(req.params.id)
        .populate("users");

    if (!warehouse) {
        return next(new AppError("المستودع غير موجود", 404));
    }

    res.status(200).json({
        message: "تم جلب المستودع بنجاح",
        warehouse
    });
});

// ================= Update =================
export const updateWarehouse = catchAsyncError(async (req, res, next) => {
    const warehouse = await warehouseModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!warehouse) {
        return next(new AppError("المستودع غير موجود", 404));
    }

    res.status(200).json({
        message: "تم تعديل المستودع بنجاح",
        warehouse
    });
});

// ================= Delete =================
export const deleteWarehouse = catchAsyncError(async (req, res, next) => {
    const warehouse = await warehouseModel.findByIdAndDelete(req.params.id);

    if (!warehouse) {
        return next(new AppError("المستودع غير موجود", 404));
    }

    res.status(200).json({
        message: "تم حذف المستودع بنجاح",
        warehouse
    });
});
