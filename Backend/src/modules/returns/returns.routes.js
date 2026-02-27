import express from "express";
import { addReturn, deleteReturn, getAllReturns, getReturnById, updateReturn } from "./returns.controller.js";
import { validation } from "../../middleware/validation.js";
import { addReturnSchema, updateReturnSchema } from "./returns.validation.js";
import { protectedRoutes, requirePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const returnsRouter = express.Router();

returnsRouter.use(protectedRoutes, applyCompanyFilter);

returnsRouter.route('/')
    .post(validation(addReturnSchema), requirePermission("sales_invoices:add"), addReturn)
    .get(requirePermission("sales_invoices:view"), getAllReturns);

returnsRouter.route('/:id')
    .get(requirePermission("sales_invoices:view"), getReturnById)
    .put(validation(updateReturnSchema), requirePermission("sales_invoices:edit"), updateReturn)
    .delete(requirePermission("sales_invoices:delete"), deleteReturn);

export default returnsRouter;
