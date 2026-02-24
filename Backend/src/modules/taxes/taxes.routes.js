import express from "express";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { addTax, deleteTax, getAllTaxes, updateTax } from "./taxes.controller.js";

const taxesRouter = express.Router();

taxesRouter.use(protectedRoutes);

taxesRouter.post('/', allowedTo("superAdmin", "admin", "accountant"), addTax);
taxesRouter.get('/', getAllTaxes);
taxesRouter.put('/:id', allowedTo("superAdmin", "admin", "accountant"), updateTax);
taxesRouter.delete('/:id', allowedTo("superAdmin", "admin"), deleteTax);

export default taxesRouter;
