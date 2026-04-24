import express from "express";
import { addProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from "./product.controller.js";
import { validation } from "../../middleware/validation.js";
import { addProductSchema, updateProductSchema } from "./product.validation.js";
import { uploadSingleFile } from "../../middleware/uploadfiles.js";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";

const productRouter = express.Router();

productRouter.use(protectedRoutes, applyCompanyFilter);
productRouter.use(requireResourcePermission("products"));

productRouter.post('/', uploadSingleFile(['image/'], 'image'), validation(addProductSchema), applyCompanyFilter, addProduct)
productRouter.get('/', getAllProducts)
productRouter.get('/:id', getProductById)
productRouter.put('/:id', uploadSingleFile(['image/'], 'image'), validation(updateProductSchema), applyCompanyFilter, updateProduct)
productRouter.delete('/:id', deleteProduct)

export default productRouter;
