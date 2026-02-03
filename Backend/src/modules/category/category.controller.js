import { categoryModel } from "./category.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

/* =========================
   Add Category
========================= */
const addCategory = catchAsyncError(async (req, res, next) => {
    const category = new categoryModel(req.body);
    await category.save();

    res.status(201).json({
        message: 'تم إضافة التصنيف بنجاح',
        category
    });
});

/* =========================
   Get All Categories
========================= */
const getAllCategories = catchAsyncError(async (req, res, next) => {
    const { search } = req.query;
    let query = {};

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const categories = await categoryModel
        .find(query)
        .populate('parentCategory', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: 'تم جلب التصنيفات بنجاح',
        categories
    });
});

/* =========================
   Get Category By ID
========================= */
const getCategoryById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const category = await categoryModel.findById(id);
    if (!category) {
        return next(new AppError('التصنيف غير موجود', 404));
    }

    res.status(200).json({
        message: 'تم جلب التصنيف بنجاح',
        category
    });
});

/* =========================
   Update Category
========================= */
const updateCategory = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const category = await categoryModel.findById(id);
    if (!category) {
        return next(new AppError('التصنيف غير موجود', 404));
    }

    Object.assign(category, req.body);
    await category.save();

    res.status(200).json({
        message: 'تم تحديث التصنيف بنجاح',
        category
    });
});

/* =========================
   Delete Category
========================= */
const deleteCategory = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const category = await categoryModel.findByIdAndDelete(id);
    if (!category) {
        return next(new AppError('التصنيف غير موجود', 404));
    }

    res.status(200).json({
        message: 'تم حذف التصنيف بنجاح',
        category
    });
});

export { addCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
