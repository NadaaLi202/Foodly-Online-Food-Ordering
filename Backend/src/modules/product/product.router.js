import express from "express";
import { addProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from "./product.controller.js";
import { validation } from "../../middleware/validation.js";
import { addProductSchema, updateProductSchema } from "./product.validation.js";

const productRouter = express.Router();


productRouter.post('/', validation(addProductSchema), addProduct)
productRouter.get('/', getAllProducts)
productRouter.get('/:id', getProductById)
productRouter.put('/:id', validation(updateProductSchema), updateProduct)
productRouter.delete('/:id', deleteProduct)

export default productRouter;

