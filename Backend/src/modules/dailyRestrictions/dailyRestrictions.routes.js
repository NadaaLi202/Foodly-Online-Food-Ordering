import express from "express";
import { addRestriction, deleteRestriction, getAllRestrictions, getNextNumber, getRestrictionById, updateRestriction } from "./dailyrestrictions.controller.js";
import { validation } from "../../middleware/validation.js";
import { addRestrictionSchema, updateRestrictionSchema } from "./dailyrestrictions.validation.js";
import { uploadSingleFile } from "../../middleware/uploadfiles.js";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";
import { parseJournalEntries } from "./parsejournalentries.js";
const dailyRestrictionRouter = express.Router();

dailyRestrictionRouter.use(protectedRoutes, applyCompanyFilter);
dailyRestrictionRouter.use(requireResourcePermission("journal_entries"));

dailyRestrictionRouter.post('/', uploadSingleFile(['image', 'application/pdf'], 'attachment'), parseJournalEntries, validation(addRestrictionSchema), addRestriction);
dailyRestrictionRouter.get('/', getAllRestrictions);
dailyRestrictionRouter.get('/next-number', getNextNumber);
dailyRestrictionRouter.get('/:id', getRestrictionById);
dailyRestrictionRouter.put('/:id', uploadSingleFile(['image', 'application/pdf'], 'attachment'), parseJournalEntries, validation(updateRestrictionSchema), updateRestriction);
dailyRestrictionRouter.delete('/:id', deleteRestriction);

export default dailyRestrictionRouter;
