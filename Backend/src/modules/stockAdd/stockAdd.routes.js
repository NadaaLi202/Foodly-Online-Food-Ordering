import express from "express";
import {
    addStockAdd,
    getAllStockAdds,
    getStockAddById,
    updateStockAdd,
    deleteStockAdd,
    addStockAddItem,
    getAllStockAddItems,
    getStockAddItemById,
    updateStockAddItem,
    deleteStockAddItem
} from "./stockAdd.controller.js";

import {
    addStockAddSchema,
    updateStockAddSchema,
    addStockAddItemSchema,
    updateStockAddItemSchema
} from "./stockAdd.validation.js";

import { validation } from "../../middleware/validation.js";
import { upload } from "../../middleware/uploadImage.js";

const router = express.Router();

// StockAdd routes
router.route("/")
    .post(upload.array('attachments', 5), validation(addStockAddSchema), addStockAdd)
    .get(getAllStockAdds);

router.route("/:id")
    .get(getStockAddById)
    .put(upload.array('attachments', 5), validation(updateStockAddSchema), updateStockAdd)
    .delete(deleteStockAdd);

// StockAddItem routes
router.route("/item")
    .post(validation(addStockAddItemSchema), addStockAddItem)
    .get(getAllStockAddItems);

router.route("/item/:id")
    .get(getStockAddItemById)
    .put(validation(updateStockAddItemSchema), updateStockAddItem)
    .delete(deleteStockAddItem);

export default router;
