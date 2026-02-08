import express from "express";
import { addExpense, deleteExpense, getAllExpenses, getExpenseById, updateExpense } from "./expense.controller.js";
import { validation } from "../../middleware/validation.js";
import { addExpenseSchema, updateExpenseSchema } from "./expense.validation.js";
import { uploadMultiFiles } from "../../middleware/uploadFiles.js";

import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const expenseRouter = express.Router();

expenseRouter.use(protectedRoutes, applyCompanyFilter);

// Routes
expenseRouter.post('/', uploadMultiFiles(['image', 'application/pdf'], [{ name: 'attachments', maxCount: 10 }]), validation(addExpenseSchema), applyCompanyFilter, addExpense)
expenseRouter.get('/', getAllExpenses)
expenseRouter.get('/:id', getExpenseById)
expenseRouter.put('/:id', uploadMultiFiles(['image', 'application/pdf'], [{ name: 'attachments', maxCount: 10 }]), validation(updateExpenseSchema), applyCompanyFilter, updateExpense)
expenseRouter.delete('/:id', deleteExpense)

export default expenseRouter;
