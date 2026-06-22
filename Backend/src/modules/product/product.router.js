import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { uploadProductImage } from '../../middleware/upload.middleware.js';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from './product.controller.js';

const productRouter = Router();

productRouter.get('/', listProducts);
productRouter.get('/:id', getProduct);
productRouter.post('/', protect, authorize('admin'), uploadProductImage, createProduct);
productRouter.put('/:id', protect, authorize('admin'), uploadProductImage, updateProduct);
productRouter.delete('/:id', protect, authorize('admin'), deleteProduct);

export default productRouter;
