import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
} from './order.controller.js';

const orderRouter = Router();

orderRouter.use(protect);

orderRouter.post('/', createOrder);
orderRouter.get('/my-orders', getMyOrders);
orderRouter.get('/:id', getOrder);
orderRouter.get('/', authorize('admin'), getAllOrders);
orderRouter.patch('/:id/status', authorize('admin'), updateOrderStatus);

export default orderRouter;
