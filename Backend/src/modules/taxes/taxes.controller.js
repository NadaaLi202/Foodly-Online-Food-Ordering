import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { taxesModel } from "./taxes.model.js";

// @desc    Add new tax
// @route   POST /api/v1/taxes
// @access  Protected (Admin, Accountant)
export const addTax = catchAsyncError(async (req, res, next) => {
    req.body.companyId = req.user.companyId;
    const tax = new taxesModel(req.body);
    await tax.save();
    res.status(201).json({ message: "Tax added successfully", tax });
});

// @desc    Get all taxes for a company
// @route   GET /api/v1/taxes
// @access  Protected
export const getAllTaxes = catchAsyncError(async (req, res, next) => {
    const taxes = await taxesModel.find({ companyId: req.user.companyId })
        .populate('paidTaxAccountId', 'name code')
        .populate('collectedTaxAccountId', 'name code');
    res.status(200).json({ taxes });
});

// @desc    Update tax
// @route   PUT /api/v1/taxes/:id
// @access  Protected (Admin, Accountant)
export const updateTax = catchAsyncError(async (req, res, next) => {
    const tax = await taxesModel.findOneAndUpdate(
        { _id: req.params.id, companyId: req.user.companyId },
        req.body,
        { new: true }
    );
    if (!tax) return next(new AppError("Tax not found", 404));
    res.status(200).json({ message: "Tax updated successfully", tax });
});

// @desc    Delete tax
// @route   DELETE /api/v1/taxes/:id
// @access  Protected (Admin)
export const deleteTax = catchAsyncError(async (req, res, next) => {
    const tax = await taxesModel.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!tax) return next(new AppError("Tax not found", 404));
    res.status(200).json({ message: "Tax deleted successfully" });
});
