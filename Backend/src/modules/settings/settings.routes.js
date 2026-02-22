import express from "express";
import { protectedRoutes } from "../auth/auth.controller.js";
import { getSettingsController, updateSettingsController, uploadLogoController, deleteLogoController } from "./settings.controller.js";
import { updateSettingsSchema, getSettingsSchema } from "./settings.validation.js";
import { validation } from "../../middleware/validation.js";
import { uploadSingleFile } from "../../middleware/uploadFiles.js";

const router = express.Router();

// All routes require authentication
router.use(protectedRoutes);

// Get settings (optionally filtered by category)
router.get(
    "/",
    validation(getSettingsSchema),
    getSettingsController
);

// Update settings for a specific category
router.patch(
    "/:category",
    validation(updateSettingsSchema),
    updateSettingsController
);

// Logo management
router.post(
    "/general/logo",
    uploadSingleFile(['image/'], 'logo'),
    uploadLogoController
);

router.delete(
    "/general/logo",
    deleteLogoController
);

export const settingsRouter = router;
