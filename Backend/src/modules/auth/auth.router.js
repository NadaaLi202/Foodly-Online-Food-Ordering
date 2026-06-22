import { Router } from 'express';
import { getProfile, login, register } from './auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/profile', protect, getProfile);

export default authRouter;
