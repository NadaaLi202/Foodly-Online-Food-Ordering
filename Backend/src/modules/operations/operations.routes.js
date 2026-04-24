import express from "express";
import {
    addOperation,
    getAllOperations,
    getOperationById,
    updateOperation,
    deleteOperation
} from "./operations.controllers.js";


import {
    addOperationSchema,
    updateOperationSchema
} from "./operations.validation.js";
import { validation } from "../../middleware/validation.js";
import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadfiles.js";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);
router.use(requireResourcePermission("inventory_operations"));

router
    .route("/")
    .post(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(addOperationSchema), applyCompanyFilter, addOperation)
    .get(getAllOperations);

router
    .route("/:id")
    .get(getOperationById)
    .put(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(updateOperationSchema), applyCompanyFilter, updateOperation)
    .delete(deleteOperation);

export default router;
