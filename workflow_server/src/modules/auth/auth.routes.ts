import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const authRouter = Router();

// ✉️ 이메일 기반 가입 및 인증 라우트
authRouter.post('/register', authController.register);
authRouter.post('/verify-email', authController.verifyEmail);
authRouter.get('/verify-email-link', authController.verifyEmailLink);
authRouter.post('/resend-verification', authController.resendVerification);

// 🔑 일반 패스워드 로그인
authRouter.post('/login', authController.emailLogin);

// 🌐 소셜 OAuth 로그인
authRouter.post('/google', authController.googleLogin);
authRouter.get('/google/callback', authController.googleCallback);

// 👤 현재 사용자 세션 정보 조회
authRouter.get('/me', requireAuth, authController.getMe);
