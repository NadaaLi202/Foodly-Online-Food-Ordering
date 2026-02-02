import express from "express";
import {
    addInventoryExchange,
    getAllInventoryExchanges,
    getInventoryExchangeById,
    updateInventoryExchange,
    deleteInventoryExchange
} from "./inventoryExchange.controller.js";

import {
    addInventoryExchangeSchema,
    updateInventoryExchangeSchema
} from "./inventoryExchange.validation.js";

import { validation } from "../../middleware/validation.js";

const router = express.Router();

router
    .route("/")
    .post(validation(addInventoryExchangeSchema), addInventoryExchange)
    .get(getAllInventoryExchanges);

router
    .route("/:id")
    .get(getInventoryExchangeById)
    .put(validation(updateInventoryExchangeSchema), updateInventoryExchange)
    .delete(deleteInventoryExchange);

export default router;
