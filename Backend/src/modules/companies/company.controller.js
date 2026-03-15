import { companyModel } from "./company.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";
import { seedDefaultChartOfAccounts } from "../chartOfAccounts/chartOfAccounts.service.js";
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

    // Seed default chart of accounts
    try {
        await seedDefaultChartOfAccounts(company._id);
    } catch (err) {
        console.error('Failed to seed chart of accounts for company:', company._id, err);
    }

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

const getCompanyBySlug = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;
    const company = await companyModel.findOne({ slug }).select('_id name slug logo');
    if (!company) {
        return next(new AppError('Company not found', 404));
    }
    res.status(200).json({ message: 'Company retrieved successfully', company });
});

const checkSlug = catchAsyncError(async (req, res, next) => {
    const { slug } = req.params;
    const company = await companyModel.findOne({ slug });
    if (company) {
        return res.status(200).json({ isAvailable: false, message: 'Slug is already taken' });
    }
    res.status(200).json({ isAvailable: true, message: 'Slug is available' });
});

const signupCompany = catchAsyncError(async (req, res, next) => {
    const companyData = { ...req.body };
    companyData.status = 'pending';

    const existingCompany = await companyModel.findOne({
        $or: [{ email: companyData.email }, { name: companyData.name }, { slug: companyData.slug }]
    });

    if (existingCompany) {
        if (existingCompany.email === companyData.email) {
            return next(new AppError('البريد الإلكتروني مستخدم بالفعل / Email already exists', 409));
        }
        if (existingCompany.name === companyData.name) {
            return next(new AppError('اسم الشركة مستخدم بالفعل / Company name already exists', 409));
        }
        if (existingCompany.slug === companyData.slug) {
            return next(new AppError('رابط الشركة (Slug) مستخدم بالفعل / Company slug already exists', 409));
        }
    }

    const company = new companyModel(companyData);
    await company.save();

    res.status(201).json({
        success: true,
        message: 'Account created successfully and is pending approval.'
    });
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

    // Only hash and set password if a non-empty password was sent (FormData may send empty string)
    if (updateData.password && (typeof updateData.password === 'string' && updateData.password.trim())) {
        updateData.password = bcrypt.hashSync(updateData.password.trim(), 10);
    } else {
        delete updateData.password;
    }

    // Normalize empty subscriptionEndDate from FormData
    if (updateData.subscriptionEndDate === '' || updateData.subscriptionEndDate === null) {
        updateData.subscriptionEndDate = null;
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
    const company = await companyModel.findById(id).select('-password');
    if (!company) {
        return next(new AppError('Company not found', 404));
    }
    const token = jwt.sign({
        userId: company._id,
        companyId: company._id,
        role: 'company'
    }, process.env.SECRET_KEY);
    const companyObj = company.toObject ? company.toObject() : company;
    companyObj.role = 'company';
    res.status(200).json({ message: 'Login as company successful', token, company: companyObj });
});

const impersonateCompany = catchAsyncError(async (req, res, next) => {
    const { companyId } = req.body;
    if (!companyId) {
        return next(new AppError('companyId is required', 400));
    }

    const company = await companyModel.findById(companyId).select('-password');
    if (!company) {
        return next(new AppError('Company not found', 404));
    }

    const token = jwt.sign({
        userId: company._id,
        companyId: company._id,
        role: 'company',
        systemRole: 'companyOwner',
        type: 'company',
        impersonatedBy: req.user?._id || null,
        impersonation: true
    }, process.env.SECRET_KEY, { expiresIn: '2h' });

    const companyObj = company.toObject ? company.toObject() : company;
    companyObj.role = 'company';

    res.status(200).json({
        message: 'Company impersonation successful',
        token,
        company: companyObj
    });
});

const sendCredentials = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const company = await companyModel.findById(id).select('-password');
    if (!company) {
        return next(new AppError('Company not found', 404));
    }
    // Optional: integrate nodemailer here to send email to company.email with login URL and credentials
    // For now return success; frontend can show "Credentials sent" (or implement email later)
    const loginUrl = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/company/${company.slug}/login`;
    res.status(200).json({
        message: 'Credentials send endpoint called successfully. Configure email service to send to ' + company.email,
        loginUrl
    });
});

const approveCompany = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const company = await companyModel.findById(id);
    if (!company) {
        return next(new AppError('Company not found', 404));
    }

    company.status = 'active';
    company.approvedAt = new Date();
    await company.save();

    // Seed default chart of accounts
    try {
        await seedDefaultChartOfAccounts(company._id);
    } catch (err) {
        console.error('Failed to seed chart of accounts for approved company:', company._id, err);
    }

    res.status(200).json({ message: 'Company approved successfully', company });
});

const rejectCompany = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { reason } = req.body;

    const company = await companyModel.findById(id);
    if (!company) {
        return next(new AppError('Company not found', 404));
    }

    company.status = 'rejected';
    company.rejectionReason = reason || 'No reason provided';
    await company.save();

    res.status(200).json({ message: 'Company rejected successfully', company });
});

export { addCompany, getAllCompanies, getCompany, getCompanyBySlug, updateCompany, deleteCompany, loginAsCompany, impersonateCompany, sendCredentials, checkSlug, signupCompany, approveCompany, rejectCompany };
