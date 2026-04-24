import { AppError } from "../../utils/apperror.js";
import { bankAccountModel } from "./bankaccount.model.js";
import { catchAsyncError } from "../../middleware/catchasyncerror.js";
import { resolveCompanyIdForWrite } from "../../middleware/applycompanyfilter.js";
import { calculateBankAccountBalance } from "./bankaccount.service.js";


// @desc    Add a new bank account
// @route   POST /api/v1/bank-accounts
// @access  Private
const addBankAccount = catchAsyncError(async (req, res, next) => {
    const companyId = resolveCompanyIdForWrite(req);
    if (!companyId) {
        return next(new AppError("Unable to resolve company context for bank account creation", 400));
    }

    const existingAccount = await bankAccountModel.findOne({ name: req.body.name, ...req.companyFilter });
    if (existingAccount) {
        return next(new AppError("Bank account with this name already exists", 409));
    }

    const bankAccount = new bankAccountModel({ ...req.body, companyId });
    await bankAccount.save();

    res.status(201).json({ message: "Bank account created successfully", bankAccount });
});

// @desc    Get all bank accounts
// @route   GET /api/v1/bank-accounts
// @access  Private
const getAllBankAccounts = catchAsyncError(async (req, res, next) => {
    const { name } = req.query;
    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };

    const bankAccounts = await bankAccountModel
        .find({ ...filter, ...req.companyFilter })
        .populate("users", "name email role")
        .populate("journalAccount", "name code");

    // Calculate dynamic balance for each bank account
    const bankAccountsWithBalance = await Promise.all(bankAccounts.map(async (account) => {
        const balance = await calculateBankAccountBalance(account._id, req.companyFilter);
        return {
            ...account.toObject(),
            balance: balance
        };
    }));

    res.status(200).json({ message: "Success", bankAccounts: bankAccountsWithBalance });
});

// @desc    Get a single bank account by ID
// @route   GET /api/v1/bank-accounts/:id
// @access  Private
const getBankAccountById = catchAsyncError(async (req, res, next) => {
    const bankAccount = await bankAccountModel
        .findOne({ _id: req.params.id, ...req.companyFilter })
        .populate("users", "name email role")
        .populate("journalAccount", "name code");

    if (!bankAccount) {
        return next(new AppError("Bank account not found", 404));
    }

    const balance = await calculateBankAccountBalance(bankAccount._id, req.companyFilter);

    res.status(200).json({
        message: "Success",
        bankAccount: { ...bankAccount.toObject(), balance }
    });
});

// @desc    Update a bank account
// @route   PUT /api/v1/bank-accounts/:id
// @access  Private
const updateBankAccount = catchAsyncError(async (req, res, next) => {
    const bankAccount = await bankAccountModel.findOneAndUpdate(
        { _id: req.params.id, ...req.companyFilter },
        req.body,
        { new: true, runValidators: true }
    );

    if (!bankAccount) {
        return next(new AppError("Bank account not found", 404));
    }

    res.status(200).json({ message: "Bank account updated successfully", bankAccount });
});

// @desc    Delete a bank account
// @route   DELETE /api/v1/bank-accounts/:id
// @access  Private
const deleteBankAccount = catchAsyncError(async (req, res, next) => {
    const bankAccount = await bankAccountModel.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });
    if (!bankAccount) {
        return next(new AppError("Bank account not found", 404));
    }
    res.status(200).json({ message: "Bank account deleted successfully" });
});

export {
    addBankAccount,
    getAllBankAccounts,
    getBankAccountById,
    updateBankAccount,
    deleteBankAccount
};
