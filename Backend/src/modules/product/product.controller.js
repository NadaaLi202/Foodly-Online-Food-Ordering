import { productModel } from "./product.model.js"
import { AppError } from "../../utils/AppError.js"
import { catchAsyncError } from "../../middleware/catchAsyncError.js"
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js"


const addProduct = catchAsyncError(async (req, res, next) => {
    const productData = { ...req.body };

    // companyId is handled by middleware (forced for non-superAdmin)
    // If superAdmin calls it, they should provide companyId or it might be null (logic in middleware allows null for superAdmin, 
    // but model requires it). So superAdmin MUST provide it.

    // Ensure companyId is present (if middleware didn't force it, e.g. superAdmin)
    if (!productData.companyId && req.user.role === 'superAdmin') {
        return next(new AppError('Company ID is required for SuperAdmin', 400));
    }
    // For others, middleware sets req.body.companyId = req.user.companyId

    // Add image path if file was uploaded
    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, 'products');
        productData.image = result.secure_url;
        productData.imagePublicId = result.public_id;
    }

    const product = new productModel(productData);
    await product.save();
    res.status(201).json({ message: 'تم إضافة المنتج بنجاح', product });
});

const getAllProducts = catchAsyncError(async (req, res, next) => {
    const { search } = req.query;
    let query = { ...req.companyFilter }; // Apply company filter

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    let products = await productModel.find(query).sort({ createdAt: -1 });
    res.status(200).json({ message: 'تم جلب المنتجات بنجاح', products });
});

const getProductById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let product = await productModel.findOne({ _id: id, ...req.companyFilter });

    if (!product) {
        return next(new AppError('المنتج غير موجود', 404));
    }
    res.status(200).json({ message: 'تم جلب المنتج بنجاح', product });
});

const updateProduct = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    // Find existing product with filter
    let existingProduct = await productModel.findOne({ _id: id, ...req.companyFilter });
    if (!existingProduct) {
        return next(new AppError('المنتج غير موجود', 404));
    }

    const updateData = { ...req.body };

    // Handle image update
    if (req.file) {
        // Delete old image if exists
        if (existingProduct.imagePublicId) {
            await deleteFromCloudinary(existingProduct.imagePublicId);
        }
        const result = await uploadToCloudinary(req.file.buffer, 'products');
        updateData.image = result.secure_url;
        updateData.imagePublicId = result.public_id;
    }

    let product = await productModel.findOneAndUpdate(
        { _id: id, ...req.companyFilter },
        updateData,
        { new: true }
    );
    res.status(200).json({ message: 'تم تحديث المنتج بنجاح', product });
});

const deleteProduct = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let product = await productModel.findOne({ _id: id, ...req.companyFilter });

    if (!product) {
        return next(new AppError('المنتج غير موجود', 404));
    }

    // Delete product image if exists
    if (product.imagePublicId) {
        await deleteFromCloudinary(product.imagePublicId);
    }

    await productModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    res.status(200).json({ message: 'تم حذف المنتج بنجاح', product });
});


export { addProduct, getAllProducts, getProductById, updateProduct, deleteProduct }