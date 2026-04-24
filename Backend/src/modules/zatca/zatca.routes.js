import express from "express";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";
import { validation } from "../../middleware/validation.js";
import { getZatcaSettingsController, updateZatcaSettingsController, initiateZatcaOnboardingController } from "./zatca.controller.js";
import { updateZatcaSchema, getZatcaSchema } from "./zatca.validation.js";

const router = express.Router();

// All routes require authentication and company filter
router.use(protectedRoutes, applyCompanyFilter);

router.get(
    "/",
    validation(getZatcaSchema),
    getZatcaSettingsController
);

router.patch(
    "/",
    validation(updateZatcaSchema),
    updateZatcaSettingsController
);

router.post(
    "/onboard",
    allowedTo("superAdmin", "admin"),
    initiateZatcaOnboardingController
);

export const zatcaRouter = router;
