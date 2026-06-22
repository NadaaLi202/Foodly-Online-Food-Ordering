import Order from '../order/order.model.js';
import Product from '../product/product.model.js';
import User from '../user/user.model.js';
import { catchAsyncError } from '../../middleware/catchAsyncError.js';

export const getDashboardStats = catchAsyncError(async (req, res) => {
  const [totalOrders, totalProducts, totalUsers, revenueAgg] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments(),
    Order.aggregate([{ $group: { _id: null, revenue: { $sum: '$totalPrice' } } }]),
  ]);

  res.json({
    stats: {
      totalOrders,
      totalProducts,
      totalUsers,
      revenue: revenueAgg[0]?.revenue || 0,
    },
  });
});
