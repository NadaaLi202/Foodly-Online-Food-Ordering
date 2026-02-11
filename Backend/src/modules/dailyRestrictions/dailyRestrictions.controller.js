import { dailyRestrictionModel } from "./dailyRestrictions.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

const addRestriction = catchAsyncError(async (req, res, next) => {
    const companyId = req.user?.companyId;
    if (!companyId) {
        return next(new AppError("Journal entries require a company context. Please sign in as a company.", 403));
    }

    const restrictionData = {
        ...req.body,
        companyId
    };

    // Ensure numeric fields from FormData (all body fields come as strings)
    restrictionData.totalDebit = Number(restrictionData.totalDebit) || 0;
    restrictionData.totalCredit = Number(restrictionData.totalCredit) || 0;
    if (restrictionData.date && typeof restrictionData.date === "string") {
        restrictionData.date = new Date(restrictionData.date);
    }

    // Map accountId to account for model (entries already parsed by parseJournalEntries)
    if (Array.isArray(restrictionData.entries)) {
        restrictionData.entries = restrictionData.entries.map(({ accountId, debit, credit, description }) => ({
            account: accountId ?? '',
            debit: Number(debit) || 0,
            credit: Number(credit) || 0,
            description: description ?? ''
        }));
    }

    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, 'dailyRestrictions');
        restrictionData.attachment = result.secure_url;
        restrictionData.attachmentPublicId = result.public_id;
    }

    const restriction = new dailyRestrictionModel(restrictionData);
    await restriction.save();
    res.status(201).json({ message: 'Daily restriction created successfully', restriction });
});

const getAllRestrictions = catchAsyncError(async (req, res, next) => {
    // Pagination and Search could be added here similar to other modules

    let restrictions = await dailyRestrictionModel.find(req.companyFilter).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Restrictions retrieved successfully', restrictions });
});

const getRestrictionById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let restriction = await dailyRestrictionModel.findOne({ _id: id, ...req.companyFilter });
    if (!restriction) {
        return next(new AppError('Restriction not found', 404));
    }
    res.status(200).json({ message: 'Restriction retrieved successfully', restriction });
});

const updateRestriction = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    let existingRestriction = await dailyRestrictionModel.findOne({ _id: id, ...req.companyFilter });
    if (!existingRestriction) {
        return next(new AppError('Restriction not found', 404));
    }

    const updateData = { ...req.body };

    // Coerce FormData string fields
    if (updateData.totalDebit !== undefined) updateData.totalDebit = Number(updateData.totalDebit) || 0;
    if (updateData.totalCredit !== undefined) updateData.totalCredit = Number(updateData.totalCredit) || 0;
    if (updateData.date && typeof updateData.date === "string") updateData.date = new Date(updateData.date);

    // Map accountId to account for model (entries already parsed by parseJournalEntries)
    if (Array.isArray(updateData.entries)) {
        updateData.entries = updateData.entries.map((entry) => ({
            account: entry.accountId ?? entry.account ?? '',
            debit: Number(entry.debit) || 0,
            credit: Number(entry.credit) || 0,
            description: entry.description ?? ''
        }));
    }

    if (req.file) {
        if (existingRestriction.attachmentPublicId) {
            await deleteFromCloudinary(existingRestriction.attachmentPublicId);
        }
        const result = await uploadToCloudinary(req.file.buffer, 'dailyRestrictions');
        updateData.attachment = result.secure_url;
        updateData.attachmentPublicId = result.public_id;
    }

    let restriction = await dailyRestrictionModel.findOneAndUpdate(
        { _id: id, ...req.companyFilter },
        updateData,
        { new: true }
    );
    res.status(200).json({ message: 'Restriction updated successfully', restriction });
});

const deleteRestriction = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let restriction = await dailyRestrictionModel.findOne({ _id: id, ...req.companyFilter });
    if (!restriction) {
        return next(new AppError('Restriction not found', 404));
    }

    if (restriction.attachmentPublicId) {
        await deleteFromCloudinary(restriction.attachmentPublicId);
    }

    await dailyRestrictionModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    res.status(200).json({ message: 'Restriction deleted successfully', restriction });
});

export { addRestriction, getAllRestrictions, getRestrictionById, updateRestriction, deleteRestriction };
