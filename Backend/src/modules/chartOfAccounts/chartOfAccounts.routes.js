import express from "express";
import { addAccount, deleteAccount, getAccountById, getAllAccounts, updateAccount, seedDefaultAccounts } from "./chartofaccounts.controller.js";
import { validation } from "../../middleware/validation.js";
import { addAccountSchema, updateAccountSchema } from "./chartofaccounts.validation.js";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";

const chartOfAccountsRouter = express.Router();

chartOfAccountsRouter.use(protectedRoutes);
chartOfAccountsRouter.use(applyCompanyFilter);
chartOfAccountsRouter.use(requireResourcePermission("ledger_accounts"));

chartOfAccountsRouter.post('/', validation(addAccountSchema), addAccount);
chartOfAccountsRouter.post('/seed', seedDefaultAccounts);
chartOfAccountsRouter.get('/', getAllAccounts);
chartOfAccountsRouter.get('/:id', getAccountById);
chartOfAccountsRouter.put('/:id', validation(updateAccountSchema), updateAccount);
chartOfAccountsRouter.delete('/:id', deleteAccount);

export default chartOfAccountsRouter;
