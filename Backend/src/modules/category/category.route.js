import express from "express";
import { addCategory, deleteCategory, getAllCategories, getCategoryById, updateCategory } from "./category.controller.js";
import { validation } from "../../middleware/validation.js";
import { addCategorySchema, updateCategorySchema } from "./category.validation.js";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";

const categoryRouter = express.Router();

categoryRouter.use(protectedRoutes, applyCompanyFilter);
categoryRouter.use(requireResourcePermission("products"));

categoryRouter.post('/', validation(addCategorySchema), addCategory);
categoryRouter.get('/', getAllCategories);
categoryRouter.get('/:id', getCategoryById);
categoryRouter.put('/:id', validation(updateCategorySchema), updateCategory);
categoryRouter.delete('/:id', deleteCategory);

export default categoryRouter;
