import { getSettings, updateSettings } from "./settings.service.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

/**
 * Get settings for the authenticated company
 */
export const getSettingsController = catchAsyncError(async (req, res, next) => {
    const { category } = req.query;
    const companyId = req.user.companyId;

    const result = await getSettings(companyId, category);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

/**
 * Update settings for the authenticated company
 */
export const updateSettingsController = catchAsyncError(async (req, res, next) => {
    const { category } = req.params;
    const { settings } = req.body;
    const companyId = req.user.companyId;

    if (!category || !['general', 'sales', 'purchases', 'customers', 'suppliers', 'accounting', 'export'].includes(category)) {
        return next(new AppError('Invalid category', 400));
    }

    const updated = await updateSettings(companyId, category, settings);

    res.status(200).json({
        status: 'success',
        message: 'Settings updated successfully',
        data: updated
    });
});

/**
 * Upload company logo
 */
export const uploadLogoController = catchAsyncError(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload an image', 400));
    }

    const companyId = req.user.companyId;

    // Get current settings to check for old logo
    const currentSettingsDoc = await getSettings(companyId, 'general');
    const currentSettings = currentSettingsDoc?.settings || {};

    // Delete old logo if exists
    if (currentSettings.logo_public_id) {
        await deleteFromCloudinary(currentSettings.logo_public_id);
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, "company_logos");

    // Update settings in DB
    const updatedSettings = {
        ...currentSettings,
        logo_path: result.secure_url,
        logo_public_id: result.public_id
    };

    const updated = await updateSettings(companyId, 'general', updatedSettings);

    res.status(200).json({
        status: 'success',
        message: 'Logo uploaded successfully',
        data: updated
    });
});

/**
 * Delete company logo
 */
export const deleteLogoController = catchAsyncError(async (req, res, next) => {
    const companyId = req.user.companyId;

    // Get current settings to check for logo
    const currentSettingsDoc = await getSettings(companyId, 'general');
    const currentSettings = currentSettingsDoc?.settings || {};

    if (!currentSettings.logo_public_id) {
        return next(new AppError('No logo found to delete', 404));
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(currentSettings.logo_public_id);

    // Update settings in DB
    const updatedSettings = { ...currentSettings };
    delete updatedSettings.logo_path;
    delete updatedSettings.logo_public_id;

    const updated = await updateSettings(companyId, 'general', updatedSettings);

    res.status(200).json({
        status: 'success',
        message: 'Logo deleted successfully',
        data: updated
    });
});
