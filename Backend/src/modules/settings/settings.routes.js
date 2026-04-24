import express from "express";
import { protectedRoutes } from "../auth/auth.controller.js";
import { getSettingsController, updateSettingsController, uploadLogoController, deleteLogoController, getCodingSettingsController, updateCodingSettingsController, updateCodingSequenceController } from "./settings.controller.js";
import { updateSettingsSchema, getSettingsSchema, codingSettingsSchema, codingSequenceSchema, getCodingSettingsSchema } from "./settings.validation.js";
import { validation } from "../../middleware/validation.js";
import { uploadSingleFile } from "../../middleware/uploadfiles.js";

const router = express.Router();

// All routes require authentication
router.use(protectedRoutes);

// Get settings (optionally filtered by category)
router.get(
    "/",
    validation(getSettingsSchema),
    getSettingsController
);

router.get(
    "/coding",
    validation(getCodingSettingsSchema),
    getCodingSettingsController
);

router.put(
    "/coding",
    validation(codingSettingsSchema),
    updateCodingSettingsController
);

router.put(
    "/coding/sequence",
    validation(codingSequenceSchema),
    updateCodingSequenceController
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
