import { productModel } from "./product.model.js"
import { AppError } from "../../utils/AppError.js"
import { catchAsyncError } from "../../middleware/catchAsyncError.js"
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js"
import { companyModel } from "../companies/company.model.js"
import mongoose from "mongoose"
import { resolveCompanyIdForWrite } from "../../middleware/applyCompanyFilter.js"

const normalizeExistingCompanyId = async (candidateId) => {
    if (!candidateId) {
        return { companyId: null, invalidFormat: false };
    }
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
        return { companyId: null, invalidFormat: true };
    }

    const company = await companyModel.findById(candidateId).select("_id").lean();
    return { companyId: company?._id ? String(company._id) : null, invalidFormat: false };
};

const resolveSuperAdminProductCompanyId = async (req) => {
    const explicitCandidate = resolveCompanyIdForWrite(req);
    const { companyId: explicitCompanyId, invalidFormat } = await normalizeExistingCompanyId(explicitCandidate);
    if (invalidFormat) {
        return { companyId: null, error: "Invalid company ID format" };
    }
    if (explicitCandidate && !explicitCompanyId) {
        return { companyId: null, error: "Company not found" };
    }
    if (explicitCompanyId) {
        return { companyId: explicitCompanyId, error: null };
    }

    // Backward-compatible fallback: when the system has exactly one company,
    // use it to avoid forcing frontend changes for superAdmin write endpoints.
    const companies = await companyModel.find({}, { _id: 1 }).limit(2).lean();
    if (companies.length === 1) {
        return { companyId: String(companies[0]._id), error: null };
    }

    return { companyId: null, error: null };
};

const addProduct = catchAsyncError(async (req, res, next) => {
    const productData = { ...req.body };
    const isSuperAdmin = req.user?.role === 'superAdmin' || req.user?.systemRole === 'superAdmin';

    let companyId;
    if (isSuperAdmin) {
        const resolved = await resolveSuperAdminProductCompanyId(req);
        if (resolved.error) {
            const statusCode = resolved.error === "Company not found" ? 404 : 400;
            return next(new AppError(resolved.error, statusCode));
        }
        companyId = resolved.companyId;
        if (!companyId) {
            return next(new AppError('Company ID is required for superAdmin product creation. Send it in body/query/header, or ensure a single company exists in the system.', 400));
        }
    } else {
        if (!req.user?.companyId) {
            return next(new AppError('User is not assigned to a company', 403));
        }
        companyId = String(req.user.companyId);
    }

    // Security: never trust tenant assignment from body for non-superAdmin users.
    productData.companyId = companyId;

    // Clean image field if it's an unexpected object (prevent CastError)
    if (productData.image && typeof productData.image !== 'string') {
        delete productData.image;
    }

    // Add image path if file was uploaded
    if (req.file) {
        console.log('[DEBUG] Image file received:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        const result = await uploadToCloudinary(req.file.buffer, 'products');
        console.log('[DEBUG] Cloudinary upload result:', result);
        productData.image = result.secure_url;
        productData.imagePublicId = result.public_id;
    } else {
        console.log('[DEBUG] No image file received (req.file is undefined)');
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

    // Clean image field if it's an unexpected object (prevent CastError)
    if (updateData.image && typeof updateData.image !== 'string') {
        delete updateData.image;
    }

    // Handle image update
    if (req.file) {
        console.log('[DEBUG] Image file received for update:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        // Delete old image if exists
        if (existingProduct.imagePublicId) {
            await deleteFromCloudinary(existingProduct.imagePublicId);
        }
        const result = await uploadToCloudinary(req.file.buffer, 'products');
        console.log('[DEBUG] Cloudinary update result:', result);
        updateData.image = result.secure_url;
        updateData.imagePublicId = result.public_id;
    } else {
        console.log('[DEBUG] No image file received for update');
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
