// controllers/stockAdd.controller.js
import { stockAddItemModel } from "./stockAddItem.model.js";
import { stockAddModel } from "./stockAdd.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// ====== StockAdd ======
// Add
export const addStockAdd = catchAsyncError(async (req, res) => {
    const opData = { ...req.body };
    if (req.files && req.files.length > 0) {
        opData.attachments = req.files.map(file => `/uploads/products/${file.filename}`);
    }
    const stockAdd = new stockAddModel(opData);
    await stockAdd.save();

    res.status(201).json({
        message: "تم إضافة StockAdd بنجاح",
        stockAdd
    });
});

// Get All
export const getAllStockAdds = catchAsyncError(async (req, res) => {
    const stockAdds = await stockAddModel.find().populate("operation").populate("createdBy").sort({ createdAt: -1 });
    res.status(200).json({
        message: "تم جلب جميع StockAdds بنجاح",
        stockAdds
    });
});

// Get By ID
export const getStockAddById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const stockAdd = await stockAddModel.findById(id).populate("operation").populate("createdBy");
    if (!stockAdd) return next(new AppError("StockAdd غير موجود", 404));
    res.status(200).json({
        message: "تم جلب StockAdd بنجاح",
        stockAdd
    });
});

// Update
export const updateStockAdd = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (req.files && req.files.length > 0) {
        updateData.attachments = req.files.map(file => `/uploads/products/${file.filename}`);
    }
    const stockAdd = await stockAddModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!stockAdd) return next(new AppError("StockAdd غير موجود", 404));
    res.status(200).json({
        message: "تم تحديث StockAdd بنجاح",
        stockAdd
    });
});

// Delete
export const deleteStockAdd = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const stockAdd = await stockAddModel.findByIdAndDelete(id);
    if (!stockAdd) return next(new AppError("StockAdd غير موجود", 404));
    res.status(200).json({
        message: "تم حذف StockAdd بنجاح",
        stockAdd
    });
});

// ====== StockAddItem ======
// Add
export const addStockAddItem = catchAsyncError(async (req, res) => {
    const item = new stockAddItemModel(req.body);
    await item.save();
    res.status(201).json({
        message: "تم إضافة StockAddItem بنجاح",
        item
    });
});

// Get All
export const getAllStockAddItems = catchAsyncError(async (req, res) => {
    const items = await stockAddItemModel.find().populate("stockAdd").populate("product").sort({ createdAt: -1 });
    res.status(200).json({
        message: "تم جلب جميع StockAddItems بنجاح",
        items
    });
});

// Get By ID
export const getStockAddItemById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const item = await stockAddItemModel.findById(id).populate("stockAdd").populate("product");
    if (!item) return next(new AppError("StockAddItem غير موجود", 404));
    res.status(200).json({
        message: "تم جلب StockAddItem بنجاح",
        item
    });
});

// Update
export const updateStockAddItem = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const item = await stockAddItemModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) return next(new AppError("StockAddItem غير موجود", 404));
    res.status(200).json({
        message: "تم تحديث StockAddItem بنجاح",
        item
    });
});

// Delete
export const deleteStockAddItem = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const item = await stockAddItemModel.findByIdAndDelete(id);
    if (!item) return next(new AppError("StockAddItem غير موجود", 404));
    res.status(200).json({
        message: "تم حذف StockAddItem بنجاح",
        item
    });
});
