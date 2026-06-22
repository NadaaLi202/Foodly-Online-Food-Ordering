import Product from './product.model.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listProductsService = ({ search, category }) => {
  const filter = {};

  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: 'i' };
  }

  if (category && category !== 'All') {
    filter.category = category;
  }

  return Product.find(filter).sort({ createdAt: -1 });
};

export const getProductService = (id) => Product.findById(id);

export const createProductService = (payload) => Product.create(payload);

export const updateProductService = (id, payload) => Product.findByIdAndUpdate(
  id,
  payload,
  { new: true, runValidators: true },
);

export const deleteProductService = (id) => Product.findByIdAndDelete(id);
