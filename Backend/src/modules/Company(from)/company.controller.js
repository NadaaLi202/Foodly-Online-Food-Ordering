import { companyModel } from "../../../dataBase/models/company(from).model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";


// Add a new company
const addCompany = catchAsyncError(async (req, res, next) => {
    let foundCompany = await companyModel.findOne({ email: req.body.email });

    if (foundCompany) {
        return next(new AppError('Company already exists', 409));
    }

    req.body.logo = req.file.filename
    let company = new companyModel(req.body);
    await company.save();
    if(!company){
        return next(new AppError('Company not added', 400));
    }
    res.status(200).json({ message: 'Company added successfully', company });
});

// Get all companies
const getAllCompanies = catchAsyncError(async (req, res, next) => {
    let companies = await companyModel.find();
    if (!companies) {
        return next(new AppError('Companies not fetched', 400));
    }
    res.status(200).json({ message: 'Companies fetched successfully', companies });
});

// Get a company by ID
const getCompanyById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let company = await companyModel.findById(id);

    if (!company) {
        return next(new AppError('Company not found', 400));
    }
    res.status(200).json({ message: 'Company fetched successfully', company });
});

// Update a company
const updateCompany = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    req.body.logo = req.file.filename
    let company = await companyModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!company) {
        return next(new AppError('Company not updated', 400));
    }
    res.status(200).json({ message: 'Company updated successfully', company });
});

// Delete a company
const deleteCompany = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let company = await companyModel.findByIdAndDelete(id);

    if (!company) {
        return next(new AppError('Company not deleted', 400));
    }
    res.status(200).json({ message: 'Company deleted successfully', company });
});

// Exporting the company controllers
export { addCompany, getAllCompanies, getCompanyById, updateCompany, deleteCompany };