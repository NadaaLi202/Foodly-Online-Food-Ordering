import { companyModel } from "./company.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const addCompany = catchAsyncError(async (req, res, next) => {
    const companyData = { ...req.body };

    // Check if company exists
    const existingCompany = await companyModel.findOne({
        $or: [{ email: companyData.email }, { name: companyData.name }]
    });
    if (existingCompany) {
        return next(new AppError('Company with this email or name already exists', 409));
    }

    // Handle logo upload
    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, 'companies-logos');
        companyData.logo = {
            url: result.secure_url,
            publicId: result.public_id
        };
    }

    const company = new companyModel(companyData);
    await company.save();

    // Remove password from response
    company.password = undefined;

    res.status(201).json({ message: 'Company created successfully', company });
});

const getAllCompanies = catchAsyncError(async (req, res, next) => {
    const companies = await companyModel.find().select('-password');
    res.status(200).json({ message: 'Companies retrieved successfully', companies });
});

const getCompany = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const company = await companyModel.findById(id).select('-password');
    if (!company) {
        return next(new AppError('Company not found', 404));
    }
    res.status(200).json({ message: 'Company retrieved successfully', company });
});

const updateCompany = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let company = await companyModel.findById(id);
    if (!company) {
        return next(new AppError('Company not found', 404));
    }

    const updateData = { ...req.body };

    // Handle logo update
    if (req.file) {
        if (company.logo && company.logo.publicId) {
            await deleteFromCloudinary(company.logo.publicId);
        }
        const result = await uploadToCloudinary(req.file.buffer, 'companies-logos');
        updateData.logo = {
            url: result.secure_url,
            publicId: result.public_id
        };
    }

    // If password is being updated, it will be hashed by the pre-save hook, 
    // but findByIdAndUpdate doesn't trigger pre-save hooks by default unless configured or manual save is used.
    // However, since we might want to trigger the hook, using manual save is better, 
    // OR we hash it here manually if we stick to findByIdAndUpdate for other fields.
    // Sticking to findByIdAndUpdate for simplicity but handling password manually if present.

    if (updateData.password) {
        updateData.password = bcrypt.hashSync(updateData.password, 10);
    }

    const updatedCompany = await companyModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    res.status(200).json({ message: 'Company updated successfully', company: updatedCompany });
});

const deleteCompany = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const company = await companyModel.findById(id);
    if (!company) {
        return next(new AppError('Company not found', 404));
    }

    if (company.logo && company.logo.publicId) {
        await deleteFromCloudinary(company.logo.publicId);
    }

    await companyModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Company deleted successfully' });
});

const loginAsCompany = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const company = await companyModel.findById(id);
    if (!company) {
        return next(new AppError('Company not found', 404));
    }

    // Generate token simulating an admin of that company
    // We don't have a specific user here, so we might need to be careful.
    // Ideally, we'd log in as a specific user, but the requirement is "Login as Company".
    // We'll create a token with the companyId and role 'admin'. 
    // The userId might be the superAdmin's ID or a placeholder if the system relies on it.
    // Let's use the superAdmin's ID as the userId to track who is acting, 
    // but the companyId will be the target company.

    // CHECK: Does the frontend/backend rely on `userId` for anything critical other than logging?
    // Most create operations use `req.user.companyId` which comes from the token.
    // `createdBy` fields might use `req.user.userId`. 

    // Let's use the SuperAdmin's ID.
    const token = jwt.sign({
        userId: req.user.userId,
        companyId: company._id,
        role: 'admin' // Impersonate as admin
    }, process.env.SECRET_KEY);

    res.status(200).json({ message: 'Login as company successful', token });
});

export { addCompany, getAllCompanies, getCompany, updateCompany, deleteCompany, loginAsCompany };
