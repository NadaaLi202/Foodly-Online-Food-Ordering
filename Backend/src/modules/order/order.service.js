import Product from '../product/product.model.js';
import Order, { ORDER_STATUSES } from './order.model.js';
import { AppError } from '../../utils/AppError.js';

export const createOrderService = async (userId, payload) => {
  const { items = [], paymentMethod, shippingAddress } = payload;

  if (!items.length) {
    throw new AppError('Cart is empty', 400);
  }

  if (!['online', 'cash'].includes(paymentMethod)) {
    throw new AppError('Invalid payment method', 400);
  }

  const productIds = items.map((item) => item.product || item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const orderItems = items.map((item) => {
    const productId = String(item.product || item.productId);
    const product = productMap.get(productId);

    if (!product) {
      throw new AppError('One or more products were not found', 404);
    }

    if (!product.isAvailable) {
      throw new AppError(`${product.name} is currently unavailable`, 400);
    }

    const quantity = Number(item.quantity);
    if (!quantity || quantity < 1) {
      throw new AppError('Each order item must have a valid quantity', 400);
    }

    return {
      product: product._id,
      name: product.name,
      image: product.image,
      quantity,
      price: product.price,
    };
  });

  const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return Order.create({
    user: userId,
    items: orderItems,
    totalPrice,
    paymentMethod,
    shippingAddress,
  });
};

export const getMyOrdersService = (userId) => Order.find({ user: userId })
  .sort({ createdAt: -1 });

export const getAllOrdersService = () => Order.find()
  .populate('user', 'name email')
  .sort({ createdAt: -1 });

export const getOrderByIdService = (id, user) => {
  const query = user.role === 'admin' ? { _id: id } : { _id: id, user: user._id };
  return Order.findOne(query).populate('user', 'name email');
};

export const updateOrderStatusService = (id, status) => {
  if (!ORDER_STATUSES.includes(status)) {
    throw new AppError('Invalid order status', 400);
  }

  return Order.findByIdAndUpdate(id, { status }, { new: true });
};
