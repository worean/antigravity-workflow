import jwt from 'jsonwebtoken';
import { prisma } from '#lib/prisma.js';

export const emailLoginService = async (data: any) => {
  const { email, password } = data;
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { socialAccounts: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // 🔒 Google 연동 계정이어서 password가 null인 경우 일반 로그인 차단
  if (user.password === null) {
    throw new Error('This account is linked with Google OAuth. Please log in using Google Login.');
  }

  if (user.password !== password) {
    throw new Error('Invalid password');
  }

  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    message: 'Login successful',
    token,
    user: { id: user.id, email: user.email, name: user.name }
  };
};
