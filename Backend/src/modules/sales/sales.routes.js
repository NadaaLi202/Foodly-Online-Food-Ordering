import express from "express";
import { createSale, deleteSale, getAllSales, getSaleById, updateSale } from "./sales.controller.js";
import { validation } from "../../middleware/validation.js";
import { createSaleSchema, updateSaleSchema } from "./sales.validation.js";

const salesRouter = express.Router();

salesRouter.route('/')
    .post(validation(createSaleSchema), createSale)
    .get(getAllSales);

salesRouter.route('/:id')
    .get(getSaleById)
    .put(validation(updateSaleSchema), updateSale)
    .delete(deleteSale);

export default salesRouter;
