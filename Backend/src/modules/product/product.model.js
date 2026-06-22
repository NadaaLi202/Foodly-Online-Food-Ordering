import mongoose from 'mongoose';

export const PRODUCT_CATEGORIES = ['Pizza', 'Burger', 'Pasta', 'Drinks', 'Desserts'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      required: [true, 'Product category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text', category: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
