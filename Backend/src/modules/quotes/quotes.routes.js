import express from "express";
import { addQuote, deleteQuote, getAllQuotes, getQuoteById, updateQuote } from "./quotes.controller.js";
import { validation } from "../../middleware/validation.js";
import { addQuoteSchema, updateQuoteSchema } from "./quotes.validation.js";
import { protectedRoutes, requirePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const quoteRouter = express.Router();

quoteRouter.use(protectedRoutes, applyCompanyFilter);

quoteRouter.route('/')
    .post(validation(addQuoteSchema), requirePermission("sales_invoices:add"), addQuote)
    .get(requirePermission("sales_invoices:view"), getAllQuotes);

quoteRouter.route('/:id')
    .get(requirePermission("sales_invoices:view"), getQuoteById)
    .put(validation(updateQuoteSchema), requirePermission("sales_invoices:edit"), updateQuote)
    .delete(requirePermission("sales_invoices:delete"), deleteQuote);

export default quoteRouter;
