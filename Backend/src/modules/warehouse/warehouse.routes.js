import express from "express";
import {
    addWarehouse,
    getAllWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse
} from "./warehouse.controller.js";

import { validation } from "../../middleware/validation.js";
import {
    addWarehouseSchema,
    updateWarehouseSchema
} from "./warehouse.validation.js";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);
router.use(requireResourcePermission("inventory_operations"));

router
    .route("/")
    .post(validation(addWarehouseSchema), addWarehouse)
    .get(getAllWarehouses);

router
    .route("/:id")
    .get(getWarehouseById)
    .put(validation(updateWarehouseSchema), updateWarehouse)
    .delete(deleteWarehouse);

export default router;
