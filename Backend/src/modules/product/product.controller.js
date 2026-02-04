import { productModel } from "./product.model.js"
import { AppError } from "../../utils/AppError.js"
import { catchAsyncError } from "../../middleware/catchAsyncError.js"
import { deleteImage } from "../../middleware/uploadImage.js"



const addProduct = catchAsyncError(async (req, res, next) => {
    const productData = { ...req.body };

    // Add image path if file was uploaded
    if (req.file) {
        productData.image = `/uploads/products/${req.file.filename}`;
    }

    const product = new productModel(productData);
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

    // Find existing product
    let existingProduct = await productModel.findById(id);
    if (!existingProduct) {
        return next(new AppError('المنتج غير موجود', 404));
    }

    const updateData = { ...req.body };

    // Handle image update
    if (req.file) {
        // Delete old image if exists
        if (existingProduct.image) {
            deleteImage(existingProduct.image);
        }
        updateData.image = `/uploads/products/${req.file.filename}`;
    }

    let product = await productModel.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: 'تم تحديث المنتج بنجاح', product });
});

const deleteProduct = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let product = await productModel.findById(id);
    if (!product) {
        return next(new AppError('المنتج غير موجود', 404));
    }

    // Delete product image if exists
    if (product.image) {
        deleteImage(product.image);
    }

    await productModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'تم حذف المنتج بنجاح', product });
});


export { addProduct, getAllProducts, getProductById, updateProduct, deleteProduct }