import { dailyRestrictionModel } from "./dailyRestrictions.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { deleteFile } from "../../middleware/uploadFile.js";

const addRestriction = catchAsyncError(async (req, res, next) => {
    const restrictionData = { ...req.body };

    // Format entries if sent as string (adjust based on frontend payload)
    if (typeof restrictionData.entries === 'string') {
        try {
            restrictionData.entries = JSON.parse(restrictionData.entries);
        } catch (error) {
            return next(new AppError('Invalid entries format', 400));
        }
    }

    if (req.file) {
        restrictionData.attachment = `/uploads/restrictions/${req.file.filename}`;
    }

    const restriction = new dailyRestrictionModel(restrictionData);
    await restriction.save();
    res.status(201).json({ message: 'Daily restriction created successfully', restriction });
});

const getAllRestrictions = catchAsyncError(async (req, res, next) => {
    // Pagination and Search could be added here similar to other modules

    let restrictions = await dailyRestrictionModel.find().sort({ createdAt: -1 });
    res.status(200).json({ message: 'Restrictions retrieved successfully', restrictions });
});

const getRestrictionById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let restriction = await dailyRestrictionModel.findById(id);
    if (!restriction) {
        return next(new AppError('Restriction not found', 404));
    }
    res.status(200).json({ message: 'Restriction retrieved successfully', restriction });
});

const updateRestriction = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    let existingRestriction = await dailyRestrictionModel.findById(id);
    if (!existingRestriction) {
        return next(new AppError('Restriction not found', 404));
    }

    const updateData = { ...req.body };

    // Format entries if sent as string
    if (typeof updateData.entries === 'string') {
        try {
            updateData.entries = JSON.parse(updateData.entries);
        } catch (error) {
            return next(new AppError('Invalid entries format', 400));
        }
    }

    if (req.file) {
        if (existingRestriction.attachment) {
            deleteFile(existingRestriction.attachment);
        }
        updateData.attachment = `/uploads/restrictions/${req.file.filename}`;
    }

    let restriction = await dailyRestrictionModel.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: 'Restriction updated successfully', restriction });
});

const deleteRestriction = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let restriction = await dailyRestrictionModel.findById(id);
    if (!restriction) {
        return next(new AppError('Restriction not found', 404));
    }

    if (restriction.attachment) {
        deleteFile(restriction.attachment);
    }

    await dailyRestrictionModel.findByIdAndDelete(id);
    res.status(200).json({ message: 'Restriction deleted successfully', restriction });
});

export { addRestriction, getAllRestrictions, getRestrictionById, updateRestriction, deleteRestriction };
