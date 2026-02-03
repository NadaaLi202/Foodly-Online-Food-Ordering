import express from "express";
import {
    addInventoryOperation,
    getAllInventoryOperations,
    getInventoryOperationById,
    updateInventoryOperation,
    deleteInventoryOperation
} from "./inventoryOperation.controller.js";

import { validation } from "../../middleware/validation.js";
import {
    addInventoryOperationSchema,
    updateInventoryOperationSchema
} from "./inventoryOperation.validation.js";

const router = express.Router();

router
    .route("/")
    .post(validation(addInventoryOperationSchema), addInventoryOperation)
    .get(getAllInventoryOperations);

router
    .route("/:id")
    .get(getInventoryOperationById)
    .put(validation(updateInventoryOperationSchema), updateInventoryOperation)
    .delete(deleteInventoryOperation);

export default router;
