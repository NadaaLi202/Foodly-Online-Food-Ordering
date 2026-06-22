import { globalErrorMiddleware } from '../middleware/globalErrorMiddleware.js';
import { AppError } from '../utils/apperror.js';
import authRouter from './auth/auth.router.js';
import productRouter from './product/product.router.js';
import orderRouter from './order/order.router.js';
import dashboardRouter from './dashboard/dashboard.router.js';
import { userRouter } from './user/user.router.js';

export function routes(app) {
  const mountApi = (prefix) => {
    app.use(`${prefix}/auth`, authRouter);
    app.use(`${prefix}/products`, productRouter);
    app.use(`${prefix}/orders`, orderRouter);
    app.use(`${prefix}/users`, userRouter);
    app.use(`${prefix}/dashboard`, dashboardRouter);
  };

  mountApi('/api');
  mountApi('/api/v1');

  app.use('*', (req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
  });

  app.use(globalErrorMiddleware);
}
