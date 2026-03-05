import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { taxesModel } from "./taxes.model.js";
import { resolveCompanyIdForWrite } from "../../middleware/applyCompanyFilter.js";
import { companyModel } from "../companies/company.model.js";
import mongoose from "mongoose";

const normalizeOptionalObjectId = (value) => {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
};

const buildTaxPayload = (body = {}, companyId) => ({
    ...body,
    companyId,
    paidTaxAccountId: normalizeOptionalObjectId(body.paidTaxAccountId),
    collectedTaxAccountId: normalizeOptionalObjectId(body.collectedTaxAccountId)
});

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

const resolveTaxCompanyId = async (req) => {
    const candidate =
        resolveCompanyIdForWrite(req) ||
        req.user?.companyId ||
        (req.user?.role === "company" ? req.user?._id : null);

    const { companyId, invalidFormat } = await normalizeExistingCompanyId(candidate);
    if (invalidFormat) return { companyId: null, error: "Invalid company ID format" };
    if (candidate && !companyId) return { companyId: null, error: "Company not found" };
    if (companyId) return { companyId, error: null };

    if (req.user?.role === "superAdmin" || req.user?.systemRole === "superAdmin") {
        // Backward-compatible fallback for superAdmin when the system has one company.
        const companies = await companyModel.find({}, { _id: 1 }).limit(2).lean();
        if (companies.length === 1) {
            return { companyId: String(companies[0]._id), error: null };
        }
    }

    return { companyId: null, error: null };
};

// @desc    Add new tax
// @route   POST /api/v1/taxes
// @access  Protected (Admin, Accountant)
export const addTax = catchAsyncError(async (req, res, next) => {
    const { companyId, error } = await resolveTaxCompanyId(req);
    if (error) {
        const statusCode = error === "Company not found" ? 404 : 400;
        return next(new AppError(error, statusCode));
    }
    if (!companyId) {
        const message = req.user?.role === "superAdmin"
            ? "Company ID is required for superAdmin taxes creation. Pass companyId in query/body/x-company-id, impersonate a company, or ensure a single company exists."
            : "Company ID is required";
        return next(new AppError(message, 400));
    }

    const payload = buildTaxPayload(req.body, companyId);
    const tax = new taxesModel(payload);
    await tax.save();
    res.status(201).json({ message: "Tax added successfully", tax });
});

// @desc    Get all taxes for a company
// @route   GET /api/v1/taxes
// @access  Protected
export const getAllTaxes = catchAsyncError(async (req, res, next) => {
    const { companyId, error } = await resolveTaxCompanyId(req);
    if (error) {
        const statusCode = error === "Company not found" ? 404 : 400;
        return next(new AppError(error, statusCode));
    }
    if (!companyId) {
        const message = req.user?.role === "superAdmin"
            ? "Company ID is required for superAdmin taxes listing. Pass companyId in query/body/x-company-id, impersonate a company, or ensure a single company exists."
            : "Company ID is required";
        return next(new AppError(message, 400));
    }

    const taxes = await taxesModel.find({ companyId })
        .populate('paidTaxAccountId', 'name code')
        .populate('collectedTaxAccountId', 'name code');
    res.status(200).json({ taxes });
});

// @desc    Update tax
// @route   PUT /api/v1/taxes/:id
// @access  Protected (Admin, Accountant)
export const updateTax = catchAsyncError(async (req, res, next) => {
    const { companyId, error } = await resolveTaxCompanyId(req);
    if (error) {
        const statusCode = error === "Company not found" ? 404 : 400;
        return next(new AppError(error, statusCode));
    }
    if (!companyId) {
        const message = req.user?.role === "superAdmin"
            ? "Company ID is required for superAdmin taxes update. Pass companyId in query/body/x-company-id, impersonate a company, or ensure a single company exists."
            : "Company ID is required";
        return next(new AppError(message, 400));
    }

    const payload = buildTaxPayload(req.body, companyId);
    const tax = await taxesModel.findOneAndUpdate(
        { _id: req.params.id, companyId },
        payload,
        { new: true }
    );
    if (!tax) return next(new AppError("Tax not found", 404));
    res.status(200).json({ message: "Tax updated successfully", tax });
});

// @desc    Delete tax
// @route   DELETE /api/v1/taxes/:id
// @access  Protected (Admin)
export const deleteTax = catchAsyncError(async (req, res, next) => {
    const { companyId, error } = await resolveTaxCompanyId(req);
    if (error) {
        const statusCode = error === "Company not found" ? 404 : 400;
        return next(new AppError(error, statusCode));
    }
    if (!companyId) {
        const message = req.user?.role === "superAdmin"
            ? "Company ID is required for superAdmin taxes delete. Pass companyId in query/body/x-company-id, impersonate a company, or ensure a single company exists."
            : "Company ID is required";
        return next(new AppError(message, 400));
    }

    const tax = await taxesModel.findOneAndDelete({ _id: req.params.id, companyId });
    if (!tax) return next(new AppError("Tax not found", 404));
    res.status(200).json({ message: "Tax deleted successfully" });
});
