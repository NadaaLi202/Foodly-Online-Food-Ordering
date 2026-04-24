import express from "express";
import { addExpense, deleteExpense, getAllExpenses, getExpenseById, updateExpense } from "./expense.controller.js";
import { validation } from "../../middleware/validation.js";
import { addExpenseSchema, updateExpenseSchema } from "./expense.validation.js";
import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadfiles.js";

import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";

const expenseRouter = express.Router();

expenseRouter.use(protectedRoutes, applyCompanyFilter);
expenseRouter.use(requireResourcePermission("finance_operations"));

// Routes
expenseRouter.post('/', uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 10 }]), validation(addExpenseSchema), applyCompanyFilter, addExpense)
expenseRouter.get('/', getAllExpenses)
expenseRouter.get('/:id', getExpenseById)
expenseRouter.put('/:id', uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 10 }]), validation(updateExpenseSchema), applyCompanyFilter, updateExpense)
expenseRouter.delete('/:id', deleteExpense)

export default expenseRouter;
