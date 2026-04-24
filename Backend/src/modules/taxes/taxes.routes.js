import express from "express";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";
import { addTax, deleteTax, getAllTaxes, updateTax } from "./taxes.controller.js";

const taxesRouter = express.Router();

taxesRouter.use(protectedRoutes, applyCompanyFilter);
taxesRouter.use(requireResourcePermission("finance_operations"));

taxesRouter.post('/', addTax);
taxesRouter.get('/', getAllTaxes);
taxesRouter.put('/:id', updateTax);
taxesRouter.delete('/:id', deleteTax);

export default taxesRouter;
