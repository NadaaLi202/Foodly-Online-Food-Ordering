import express from "express";
import { addRestriction, deleteRestriction, getAllRestrictions, getRestrictionById, updateRestriction } from "./dailyRestrictions.controller.js";
import { validation } from "../../middleware/validation.js";
import { addRestrictionSchema, updateRestrictionSchema } from "./dailyRestrictions.validation.js";
import { uploadSingleFile } from "../../middleware/uploadFiles.js";
import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const dailyRestrictionRouter = express.Router();

dailyRestrictionRouter.use(protectedRoutes, applyCompanyFilter);

dailyRestrictionRouter.post('/', uploadSingleFile(['image', 'application/pdf'], 'attachment'), validation(addRestrictionSchema), applyCompanyFilter, addRestriction);
dailyRestrictionRouter.get('/', getAllRestrictions);
dailyRestrictionRouter.get('/:id', getRestrictionById);
dailyRestrictionRouter.put('/:id', uploadSingleFile(['image', 'application/pdf'], 'attachment'), validation(updateRestrictionSchema), applyCompanyFilter, updateRestriction);
dailyRestrictionRouter.delete('/:id', deleteRestriction);

export default dailyRestrictionRouter;
