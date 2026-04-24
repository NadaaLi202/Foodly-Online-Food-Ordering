import { catchAsyncError } from "../../middleware/catchasyncerror.js";
import { AppError } from "../../utils/apperror.js";
import { zatcaModel } from "./zatca.model.js";

// Get ZATCA settings for a company
export const getZatcaSettingsController = catchAsyncError(async (req, res, next) => {
    const { companyId } = req.user;

    if (!companyId) {
        // Return default empty settings if no company context is provided (e.g. SuperAdmin browsing)
        return res.status(200).json({
            status: 'success',
            data: {
                zatca: {
                    isEnabled: false,
                    phase: 'phase1',
                    settings: {
                        phase1: { isActive: false },
                        phase2: { isActive: false, environment: 'sandbox' }
                    }
                }
            }
        });
    }

    let zatcaSettings = await zatcaModel.findOne({ companyId });

    if (!zatcaSettings) {
        // Create default settings if not exists
        zatcaSettings = await zatcaModel.create({
            companyId,
            isEnabled: false,
            phase: 'phase1',
            settings: {
                phase1: { isActive: false },
                phase2: { isActive: false, environment: 'sandbox' }
            }
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            zatca: zatcaSettings
        }
    });
});

// Update ZATCA settings
export const updateZatcaSettingsController = catchAsyncError(async (req, res, next) => {
    const { companyId } = req.user;

    if (!companyId) {
        return next(new AppError("To update ZATCA settings, you must have a company context. If you are an Admin, please select a company or impersonate it.", 403));
    }

    const updateData = req.body;

    let zatcaSettings = await zatcaModel.findOneAndUpdate(
        { companyId },
        { ...updateData, companyId }, // Ensure companyId stays correct
        { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
        status: 'success',
        data: {
            zatca: zatcaSettings
        }
    });
});

// Placeholder for Phaes 2 onboarding logic
export const initiateZatcaOnboardingController = catchAsyncError(async (req, res, next) => {
    const { companyId } = req.user;
    // Logic for generating CSR, Private Key, and calling ZATCA onboarding API
    // This is typically a complex flow involving external API calls

    res.status(200).json({
        status: 'success',
        message: 'Onboarding process initiated'
    });
});
