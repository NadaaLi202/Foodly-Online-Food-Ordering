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
import { upload } from "../../middleware/uploadImage.js";

const router = express.Router();

router
    .route("/")
    .post(upload.array('attachments', 5), validation(addOperationSchema), addOperation)
    .get(getAllOperations);

router
    .route("/:id")
    .get(getOperationById)
    .put(upload.array('attachments', 5), validation(updateOperationSchema), updateOperation)
    .delete(deleteOperation);

export default router;
