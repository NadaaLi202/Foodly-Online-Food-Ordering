import express from "express";
import {
    addTransferProcess,
    getAllTransferProcesses,
    getTransferProcessById,
    deleteTransferProcess,
    updateTransferProcess
} from "./transferProcess.controller.js";

import { validation } from "../../middleware/validation.js";
import { addTransferProcessSchema, updateTransferProcessSchema } from "./transferProcess.validation.js";

const router = express.Router();

router
    .route("/")
    .post(validation(addTransferProcessSchema), addTransferProcess)
    .get(getAllTransferProcesses);

router
    .route("/:id")
    .get(getTransferProcessById)
    .delete(deleteTransferProcess);

router.put(
    "/:id",
    validation(updateTransferProcessSchema),
    updateTransferProcess
);

export default router;
