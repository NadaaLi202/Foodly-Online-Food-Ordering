import express from "express";
import { addCompany, deleteCompany, getAllCompanies, getCompany, updateCompany, loginAsCompany } from "./company.controller.js";
import { validation } from "../../middleware/validation.js";
import { addCompanySchema, updateCompanySchema } from "./company.validation.js";
import { uploadSingleFile } from "../../middleware/uploadFiles.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";

const companyRouter = express.Router();

companyRouter.post('/', uploadSingleFile(['logo'], 'logo'), validation(addCompanySchema), protectedRoutes, allowedTo('superAdmin'), addCompany);
companyRouter.get('/', protectedRoutes, allowedTo('superAdmin'), getAllCompanies);
companyRouter.get('/:id', protectedRoutes, allowedTo('superAdmin'), getCompany);
companyRouter.put('/:id', uploadSingleFile(['logo'], 'logo'), validation(updateCompanySchema), protectedRoutes, allowedTo('superAdmin'), updateCompany);
companyRouter.delete('/:id', protectedRoutes, allowedTo('superAdmin'), deleteCompany);
companyRouter.post('/:id/login', protectedRoutes, allowedTo('superAdmin'), loginAsCompany);

export default companyRouter;
