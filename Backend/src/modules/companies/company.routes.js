import express from "express";
import { addCompany, deleteCompany, getAllCompanies, getCompany, getCompanyBySlug, updateCompany, loginAsCompany, impersonateCompany, sendCredentials, checkSlug, signupCompany, approveCompany, rejectCompany, seedMainSafesAdmin } from "./company.controller.js";
import { validation } from "../../middleware/validation.js";
import { addCompanySchema, updateCompanySchema, companySignupSchema } from "./company.validation.js";
import { uploadSingleFile } from "../../middleware/uploadfiles.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";

const companyRouter = express.Router();

companyRouter.post('/', uploadSingleFile(['image'], 'logo'), validation(addCompanySchema), protectedRoutes, allowedTo('superAdmin'), addCompany);
companyRouter.post('/signup', validation(companySignupSchema), signupCompany);
companyRouter.post('/impersonate', protectedRoutes, allowedTo('superAdmin'), impersonateCompany);
companyRouter.post('/admin/seed-main-safes', protectedRoutes, allowedTo('superAdmin'), seedMainSafesAdmin);
companyRouter.get('/check-slug/:slug', checkSlug);
companyRouter.get('/', protectedRoutes, allowedTo('superAdmin'), getAllCompanies);
companyRouter.get('/slug/:slug', getCompanyBySlug);
companyRouter.get('/:id', protectedRoutes, allowedTo('superAdmin'), getCompany);
companyRouter.put('/:id', uploadSingleFile(['image'], 'logo'), validation(updateCompanySchema), protectedRoutes, allowedTo('superAdmin'), updateCompany);
companyRouter.delete('/:id', protectedRoutes, allowedTo('superAdmin'), deleteCompany);
companyRouter.post('/:id/login', protectedRoutes, allowedTo('superAdmin'), loginAsCompany);
companyRouter.post('/:id/send-credentials', protectedRoutes, allowedTo('superAdmin'), sendCredentials);
companyRouter.post('/:id/approve', protectedRoutes, allowedTo('superAdmin'), approveCompany);
companyRouter.post('/:id/reject', protectedRoutes, allowedTo('superAdmin'), rejectCompany);

export default companyRouter;
