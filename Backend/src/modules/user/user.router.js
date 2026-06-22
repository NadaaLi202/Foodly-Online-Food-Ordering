import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { deleteUser, getUsers, updateUserRole } from './user.controller.js';

export const userRouter = Router();

userRouter.use(protect, authorize('admin'));

userRouter.get('/', getUsers);
userRouter.delete('/:id', deleteUser);
userRouter.patch('/:id/role', updateUserRole);
