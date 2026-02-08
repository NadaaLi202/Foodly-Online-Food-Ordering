import { branchModel } from "./branch.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addBranch = catchAsyncError(async (req, res, next) => {
    const { code } = req.body;
    const { companyFilter } = req;

    const existingBranch = await branchModel.findOne({ code, ...companyFilter });
    if (existingBranch) {
        return next(new AppError('Branch code already exists for this company', 400));
    }

    const branch = new branchModel({ ...req.body, companyId: req.user.companyId });
    await branch.save();
    res.status(201).json({ message: 'Branch created successfully', branch });
});

const getAllBranches = catchAsyncError(async (req, res, next) => {
    const branches = await branchModel.find(req.companyFilter).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Branches retrieved successfully', branches });
});

const getBranchById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const branch = await branchModel.findOne({ _id: id, ...req.companyFilter });
    if (!branch) {
        return next(new AppError('Branch not found', 404));
    }
    res.status(200).json({ message: 'Branch retrieved successfully', branch });
});

const updateBranch = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { code } = req.body;
    const { companyFilter } = req;

    const branchExists = await branchModel.findOne({ _id: id, ...companyFilter });
    if (!branchExists) {
        return next(new AppError('Branch not found', 404));
    }

    if (code && code !== branchExists.code) {
        const duplicateCode = await branchModel.findOne({ code, ...companyFilter });
        if (duplicateCode) {
            return next(new AppError('Branch code already exists for this company', 400));
        }
    }

    const branch = await branchModel.findOneAndUpdate(
        { _id: id, ...companyFilter },
        req.body,
        { new: true }
    );
    res.status(200).json({ message: 'Branch updated successfully', branch });
});

const deleteBranch = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const branch = await branchModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    if (!branch) {
        return next(new AppError('Branch not found', 404));
    }
    res.status(200).json({ message: 'Branch deleted successfully', branch });
});

export { addBranch, getAllBranches, getBranchById, updateBranch, deleteBranch };
