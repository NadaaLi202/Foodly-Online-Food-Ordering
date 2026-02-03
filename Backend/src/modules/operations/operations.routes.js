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

const router = express.Router();

router
    .route("/")
    .post(validation(addOperationSchema), addOperation)
    .get(getAllOperations);

router
    .route("/:id")
    .get(getOperationById)
    .put(validation(updateOperationSchema), updateOperation)
    .delete(deleteOperation);

export default router;
