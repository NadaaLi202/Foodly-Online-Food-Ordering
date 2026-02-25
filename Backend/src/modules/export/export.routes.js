import express from "express";
import * as exportController from "./export.controller.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";

const exportRouter = express.Router();

exportRouter.use(protectedRoutes);
exportRouter.use(allowedTo('admin', 'accountant'));

exportRouter.get('/products', exportController.exportProducts);
exportRouter.get('/customers', exportController.exportCustomers);
exportRouter.get('/suppliers', exportController.exportSuppliers);

export default exportRouter;
