


import express from "express";
import { addProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from "./product.controller.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";

const productRouter = express.Router();


productRouter.post('/',protectedRoutes,allowedTo('admin'),addProduct)
productRouter.get('/',protectedRoutes,allowedTo('admin'),getAllProducts)
productRouter.get('/:id',getProductById)
productRouter.put('/:id',protectedRoutes,allowedTo('admin'),updateProduct)
productRouter.delete('/:id',protectedRoutes,allowedTo('admin'),deleteProduct)

export default productRouter;

