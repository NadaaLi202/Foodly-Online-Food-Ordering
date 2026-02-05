import express from "express";
import { addRestriction, deleteRestriction, getAllRestrictions, getRestrictionById, updateRestriction } from "./dailyRestrictions.controller.js";
import { validation } from "../../middleware/validation.js";
import { addRestrictionSchema, updateRestrictionSchema } from "./dailyRestrictions.validation.js";
import { uploadFile } from "../../middleware/uploadFile.js";

const dailyRestrictionRouter = express.Router();

dailyRestrictionRouter.post('/', uploadFile.single('attachment'), validation(addRestrictionSchema), addRestriction);
dailyRestrictionRouter.get('/', getAllRestrictions);
dailyRestrictionRouter.get('/:id', getRestrictionById);
dailyRestrictionRouter.put('/:id', uploadFile.single('attachment'), validation(updateRestrictionSchema), updateRestriction);
dailyRestrictionRouter.delete('/:id', deleteRestriction);

export default dailyRestrictionRouter;
