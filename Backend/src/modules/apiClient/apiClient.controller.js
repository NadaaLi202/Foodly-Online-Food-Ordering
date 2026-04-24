import { apiClientModel } from "./apiclient.model.js";
import { catchAsyncError } from "../../middleware/catchasyncerror.js";
import { AppError } from "../../utils/apperror.js";

// ========== GET ALL CLIENTS ==========
export const getAllClients = catchAsyncError(async (req, res, next) => {
    const clients = await apiClientModel.find({ companyId: req.user.companyId }).populate('branches', 'name');
    res.status(200).json({ status: "success", data: clients });
});

// ========== CREATE CLIENT ==========
export const createClient = catchAsyncError(async (req, res, next) => {
    const { name, role, branches } = req.body;

    const existing = await apiClientModel.findOne({ companyId: req.user.companyId, name });
    if (existing) return next(new AppError("Client name already exists", 400));

    const client = await apiClientModel.create({
        name,
        role,
        branches,
        companyId: req.user.companyId
    });

    res.status(201).json({ status: "success", data: client });
});

// ========== DELETE CLIENT ==========
export const deleteClient = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const client = await apiClientModel.findOneAndDelete({ _id: id, companyId: req.user.companyId });

    if (!client) return next(new AppError("Client not found", 404));

    res.status(200).json({ status: "success", message: "Client deleted successfully" });
});

// ========== REGENERATE TOKEN ==========
export const regenerateToken = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const crypto = await import('crypto');
    const newToken = crypto.randomBytes(32).toString('hex');

    const client = await apiClientModel.findOneAndUpdate(
        { _id: id, companyId: req.user.companyId },
        { token: newToken },
        { new: true }
    );

    if (!client) return next(new AppError("Client not found", 404));

    res.status(200).json({ status: "success", token: newToken });
});
