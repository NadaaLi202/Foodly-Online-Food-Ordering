import express from "express";
import { addCompany, deleteCompany, getAllCompanies, getCompanyById, updateCompany } from "./company.controller.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { fileUpload } from "../../middleware/fileUploads.js";





export const companyRouter = express.Router();

companyRouter.post('/',fileUpload('logo','company'),addCompany)
companyRouter.get('/',protectedRoutes,allowedTo("user"),getAllCompanies) 
companyRouter.get('/:id',getCompanyById)
companyRouter.put('/:id',fileUpload('logo','company'),updateCompany)
companyRouter.delete('/:id',protectedRoutes,allowedTo("user"),deleteCompany)