import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const authRouter = Router();

authRouter.post('/google', authController.googleLogin);
authRouter.get('/google/callback', authController.googleCallback);
authRouter.post('/login', authController.emailLogin);
authRouter.get('/me', requireAuth, authController.getMe);
