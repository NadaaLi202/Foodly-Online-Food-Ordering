import jwt from 'jsonwebtoken';
import User from '../user/user.model.js';
import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import { AppError } from '../../utils/AppError.js';

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET || process.env.SECRET_KEY || 'development-secret-change-me',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
);

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user);

  res.status(statusCode).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
};

export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return next(new AppError('Name, email, password and confirm password are required', 400));
  }

  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email is already registered', 409));
  }

  const user = await User.create({ name, email, password, role: 'customer' });
  sendAuthResponse(res, user, 201);
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  sendAuthResponse(res, user);
});

export const getProfile = catchAsyncError(async (req, res) => {
  res.json({ user: req.user });
});
