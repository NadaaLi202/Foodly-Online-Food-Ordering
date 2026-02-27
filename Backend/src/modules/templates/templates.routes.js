import express from "express";
import {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    uploadLogo,
    uploadSignature
} from "./templates.controller.js";
import { validation } from "../../middleware/validation.js";
import { createTemplateSchema, updateTemplateSchema } from "./templates.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";
import { uploadSingleFile } from "../../middleware/uploadFiles.js";

const templateRouter = express.Router();

templateRouter.use(protectedRoutes, applyCompanyFilter);

templateRouter.route('/')
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getAllTemplates)
    .post(validation(createTemplateSchema), allowedTo("superAdmin", "admin", "accountant"), createTemplate);

templateRouter.route('/:id')
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getTemplateById)
    .put(validation(updateTemplateSchema), allowedTo("superAdmin", "admin", "accountant"), updateTemplate)
    .delete(allowedTo("superAdmin", "admin"), deleteTemplate);

// Logo upload
templateRouter.post(
    '/:id/logo',
    uploadSingleFile(['image/'], 'logo'),
    allowedTo("superAdmin", "admin", "accountant"),
    uploadLogo
);

// Signature upload (index 0=left, 1=middle, 2=right)
templateRouter.post(
    '/:id/signature/:index',
    uploadSingleFile(['image/'], 'signature'),
    allowedTo("superAdmin", "admin", "accountant"),
    uploadSignature
);

export default templateRouter;
