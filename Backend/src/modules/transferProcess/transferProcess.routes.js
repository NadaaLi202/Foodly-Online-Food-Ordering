import express from "express";
import {
    addTransferProcess,
    getAllTransferProcesses,
    getTransferProcessById,
    deleteTransferProcess,
    updateTransferProcess
} from "./transferprocess.controller.js";

import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";
import { validation } from "../../middleware/validation.js";
import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadfiles.js";
import { addTransferProcessSchema, updateTransferProcessSchema } from "./transferprocess.validation.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);
router.use(requireResourcePermission("inventory_operations"));

router
    .route("/")
    .post(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(addTransferProcessSchema), applyCompanyFilter, addTransferProcess)
    .get(getAllTransferProcesses);

router
    .route("/:id")
    .get(getTransferProcessById)
    .delete(deleteTransferProcess);

router.put(
    "/:id",
    uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]),
    validation(updateTransferProcessSchema),
    applyCompanyFilter,
    updateTransferProcess
);

export default router;
