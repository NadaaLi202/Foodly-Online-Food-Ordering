import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import { AppError } from '../../utils/AppError.js';
import {
  createOrderService,
  getAllOrdersService,
  getMyOrdersService,
  getOrderByIdService,
  updateOrderStatusService,
} from './order.service.js';

export const createOrder = catchAsyncError(async (req, res) => {
  const order = await createOrderService(req.user._id, req.body);
  res.status(201).json({ order });
});

export const getMyOrders = catchAsyncError(async (req, res) => {
  const orders = await getMyOrdersService(req.user._id);
  res.json({ orders });
});

export const getAllOrders = catchAsyncError(async (req, res) => {
  const orders = await getAllOrdersService();
  res.json({ orders });
});

export const getOrder = catchAsyncError(async (req, res, next) => {
  const order = await getOrderByIdService(req.params.id, req.user);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.json({ order });
});

export const updateOrderStatus = catchAsyncError(async (req, res, next) => {
  const order = await updateOrderStatusService(req.params.id, req.body.status);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.json({ order });
});
