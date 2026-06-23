import User from './user.model.js';
import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import { AppError } from '../../utils/AppError.js';

export const getUsers = catchAsyncError(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
});

export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const { role } = req.body;

  if (!['admin', 'customer'].includes(role)) {
    return next(new AppError('Role must be admin or customer', 400));
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({ user });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  if (req.user.id === req.params.id) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(204).send();
});
