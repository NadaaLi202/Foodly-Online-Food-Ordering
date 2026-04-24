import express from "express";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";
import { validation } from "../../middleware/validation.js";
import { createCostCenter, deleteCostCenter, getAllCostCenters, getParentCostCenters, updateCostCenter } from "./costcenter.controller.js";
import { createCostCenterSchema, idParamSchema, listCostCentersSchema, updateCostCenterSchema } from "./costcenter.validation.js";

const costCenterRouter = express.Router();

costCenterRouter.use(protectedRoutes, applyCompanyFilter);
costCenterRouter.use(requireResourcePermission("ledger_accounts"));

costCenterRouter.get('/parents', getParentCostCenters);
costCenterRouter.get('/', validation(listCostCentersSchema), getAllCostCenters);
costCenterRouter.post('/', validation(createCostCenterSchema), createCostCenter);
costCenterRouter.put('/:id', validation(updateCostCenterSchema), updateCostCenter);
costCenterRouter.delete('/:id', validation(idParamSchema), deleteCostCenter);

export default costCenterRouter;
