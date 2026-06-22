import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import { AppError } from '../../utils/apperror.js';
import {
  createProductService,
  deleteProductService,
  getProductService,
  listProductsService,
  updateProductService,
} from './product.service.js';

const fileUrl = (req) => {
  if (!req.file) {
    return null;
  }

  return `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
};

const productPayload = (req) => {
  const payload = {
    name: req.body.name,
    description: req.body.description,
    image: fileUrl(req) || req.body.image,
    category: req.body.category,
    price: Number(req.body.price),
    isAvailable: req.body.isAvailable === undefined
      ? true
      : req.body.isAvailable === true || req.body.isAvailable === 'true',
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === '' || Number.isNaN(payload[key])) {
      delete payload[key];
    }
  });

  return payload;
};

export const listProducts = catchAsyncError(async (req, res) => {
  const products = await listProductsService(req.query);
  res.json({ products });
});

export const getProduct = catchAsyncError(async (req, res, next) => {
  const product = await getProductService(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.json({ product });
});

export const createProduct = catchAsyncError(async (req, res) => {
  const product = await createProductService(productPayload(req));
  res.status(201).json({ product });
});

export const updateProduct = catchAsyncError(async (req, res, next) => {
  const product = await updateProductService(req.params.id, productPayload(req));

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.json({ product });
});

export const deleteProduct = catchAsyncError(async (req, res, next) => {
  const product = await deleteProductService(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(204).send();
});
