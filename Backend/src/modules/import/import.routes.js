import express from "express";
import * as importController from "./import.controller.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";
import { uploadSingleFile } from "../../middleware/uploadFiles.js";

const importRouter = express.Router();

const IMPORT_MIMETYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv'
];

importRouter.use(protectedRoutes);
importRouter.use(allowedTo('admin', 'accountant'));

importRouter.post('/products', uploadSingleFile(IMPORT_MIMETYPES, 'file'), importController.importProducts);
importRouter.post('/customers', uploadSingleFile(IMPORT_MIMETYPES, 'file'), importController.importCustomers);
importRouter.post('/suppliers', uploadSingleFile(IMPORT_MIMETYPES, 'file'), importController.importSuppliers);

export default importRouter;
