import { chartOfAccountsModel } from "./chartOfAccounts.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addAccount = catchAsyncError(async (req, res, next) => {
    const { code } = req.body;

    const existingAccount = await chartOfAccountsModel.findOne({ code });
    if (existingAccount) {
        return next(new AppError('Account code already exists', 400));
    }

    const account = new chartOfAccountsModel(req.body);
    await account.save();
    res.status(201).json({ message: 'Account created successfully', account });
});

const getAllAccounts = catchAsyncError(async (req, res, next) => {
    // Basic filtering
    const { type, parentAccount } = req.query;
    let query = {};
    if (type) query.type = type;
    if (parentAccount) query.parentAccount = parentAccount;

    const accounts = await chartOfAccountsModel.find(query).populate('parentAccount', 'name code').sort({ code: 1 });
    res.status(200).json({ message: 'Accounts retrieved successfully', accounts });
});

const getAccountById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const account = await chartOfAccountsModel.findById(id).populate('parentAccount', 'name code');
    if (!account) {
        return next(new AppError('Account not found', 404));
    }
    res.status(200).json({ message: 'Account retrieved successfully', account });
});

const updateAccount = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { code } = req.body;

    const accountExists = await chartOfAccountsModel.findById(id);
    if (!accountExists) {
        return next(new AppError('Account not found', 404));
    }

    if (code && code !== accountExists.code) {
        const duplicateCode = await chartOfAccountsModel.findOne({ code });
        if (duplicateCode) {
            return next(new AppError('Account code already exists', 400));
        }
    }

    const account = await chartOfAccountsModel.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ message: 'Account updated successfully', account });
});

const deleteAccount = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const account = await chartOfAccountsModel.findById(id);
    if (!account) {
        return next(new AppError('Account not found', 404));
    }

    // Check for child accounts
    const childAccounts = await chartOfAccountsModel.findOne({ parentAccount: id });
    if (childAccounts) {
        return next(new AppError('Cannot delete account with child accounts', 400));
    }

    // In a real app, also check if account is used in transactions

    await chartOfAccountsModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Account deleted successfully', account });
});

export { addAccount, getAllAccounts, getAccountById, updateAccount, deleteAccount };
