import { inventoryExchangeModel } from "./inventoryExchange.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { operationModel } from "../Operations/operations.model.js";


// Add
export const addInventoryExchange = catchAsyncError(async (req, res, next) => {
    const { operation } = req.body;

    // تحقق من العملية
    const operationDoc = await operationModel.findById(operation);
    if (!operationDoc) {
        return next(new AppError("العملية غير موجودة", 404));
    }

    if (operationDoc.type !== "inventory exchange process") {
        return next(
            new AppError("نوع العملية لا يسمح بإنشاء Inventory Exchange", 400)
        );
    }

    const exchangeData = { ...req.body };
    if (req.files && req.files.length > 0) {
        exchangeData.attachments = req.files.map(file => `/uploads/products/${file.filename}`);
    }
    const exchange = new inventoryExchangeModel(exchangeData);
    await exchange.save();

    res.status(201).json({
        message: "تم إضافة عملية تبادل المخزون بنجاح",
        exchange
    });
});

// Get All
export const getAllInventoryExchanges = catchAsyncError(async (req, res) => {
    const exchanges = await inventoryExchangeModel
        .find()
        .populate("operation")
        .populate("product")
        .populate("createdBy")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب عمليات تبادل المخزون بنجاح",
        exchanges
    });
});

// Get By ID
export const getInventoryExchangeById = catchAsyncError(async (req, res, next) => {
    const exchange = await inventoryExchangeModel
        .findById(req.params.id)
        .populate("operation")
        .populate("product")
        .populate("createdBy");

    if (!exchange) {
        return next(new AppError("عملية تبادل المخزون غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم جلب العملية بنجاح",
        exchange
    });
});

// Update
export const updateInventoryExchange = catchAsyncError(async (req, res, next) => {
    const updateData = { ...req.body };
    if (req.files && req.files.length > 0) {
        // Here you might want to merge with existing or replace
        updateData.attachments = req.files.map(file => `/uploads/products/${file.filename}`);
    }
    const exchange = await inventoryExchangeModel.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
    );

    if (!exchange) {
        return next(new AppError("عملية تبادل المخزون غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم تحديث العملية بنجاح",
        exchange
    });
});

// Delete
export const deleteInventoryExchange = catchAsyncError(async (req, res, next) => {
    const exchange = await inventoryExchangeModel.findByIdAndDelete(req.params.id);

    if (!exchange) {
        return next(new AppError("عملية تبادل المخزون غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم حذف العملية بنجاح",
        exchange
    });
});
