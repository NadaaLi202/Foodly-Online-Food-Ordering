import { productModel } from "./product.model.js"
import { AppError } from "../../utils/AppError.js"
import { catchAsyncError } from "../../middleware/catchAsyncError.js"



const addProduct = catchAsyncError(async (req, res, next) => {
    const product = new productModel(req.body);
    await product.save();
    res.status(201).json({ message: 'تم إضافة المنتج بنجاح', product });
});

const getAllProducts = catchAsyncError(async (req, res, next) => {
    const { search } = req.query;
    let query = {};
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    let products = await productModel.find(query).sort({ createdAt: -1 });
    res.status(200).json({ message: 'تم جلب المنتجات بنجاح', products });
});

const getProductById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let product = await productModel.findById(id);
    if (!product) {
        return next(new AppError('المنتج غير موجود', 404));
    }
    res.status(200).json({ message: 'تم جلب المنتج بنجاح', product });
});

const updateProduct = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let product = await productModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) {
        return next(new AppError('المنتج غير موجود', 404));
    }
    res.status(200).json({ message: 'تم تحديث المنتج بنجاح', product });
});

const deleteProduct = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let product = await productModel.findByIdAndDelete(id);
    if (!product) {
        return next(new AppError('المنتج غير موجود', 404));
    }
    res.status(200).json({ message: 'تم حذف المنتج بنجاح', product });
});


export { addProduct, getAllProducts, getProductById, updateProduct, deleteProduct }