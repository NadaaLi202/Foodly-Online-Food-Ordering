import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { getDashboardStats } from './dashboard.controller.js';

const dashboardRouter = Router();

dashboardRouter.get('/stats', protect, authorize('admin'), getDashboardStats);

export default dashboardRouter;
