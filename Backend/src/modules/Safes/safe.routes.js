import express from "express";
import {
    addSafe,
    getAllSafes,
    getSafeById,
    updateSafe,
    deleteSafe
} from "./safe.controller.js";

import { validation } from "../../middleware/validation.js";
import { addSafeSchema, updateSafeSchema } from "./safe.validation.js";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);
router.use(requireResourcePermission("finance_operations"));

router
    .route("/")
    .post(validation(addSafeSchema), addSafe)
    .get(getAllSafes);

router
    .route("/:id")
    .get(getSafeById)
    .put(validation(updateSafeSchema), updateSafe)
    .delete(deleteSafe);

export default router;
