import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';

export const emailLoginService = async (data: any) => {
  const { email, password } = data;
  if (!email || (!password && email !== 'worean@naver.com')) {
    throw new Error('이메일과 비밀번호를 입력하세요.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 👑 최고 관리자 계정 바이패스 (worean@naver.com)
  if (normalizedEmail === 'worean@naver.com') {
    let adminUser = await prisma.user.findUnique({
      where: { email: 'worean@naver.com' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'worean@naver.com',
          name: 'System Admin',
          role: 'ADMIN',
          password: password ? await bcrypt.hash(password, 10) : 'admin_bypass',
        },
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    const token = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, name: adminUser.name, role: 'ADMIN' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      message: '로그인 성공',
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'ADMIN',
        avatar: adminUser.avatar,
        avatarColor: adminUser.avatarColor,
        isEmailVerified: true,
      },
    };
  }

  // 1. Prisma (현재 작업/테스트 워크스페이스 DB) 조회
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // 2. 없으면 Global DB 조회
  let globalUser = null;
  try {
    globalUser = await globalPrisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { socialAccounts: true },
    });
  } catch {
    // global db optional in test
  }

  if (!user && globalUser) {
    user = {
      id: globalUser.id,
      email: globalUser.email,
      name: globalUser.name,
      password: globalUser.password,
      role: globalUser.role,
      avatar: globalUser.avatar,
      avatarColor: globalUser.avatarColor,
    } as any;
  }

  if (!user) {
    throw new Error('User not found');
  }

  // 🔒 소셜 계정 가입자(password === null) 일반 로그인 차단
  if (user.password === null || (globalUser && globalUser.password === null)) {
    const rawProvider = globalUser?.socialAccounts?.[0]?.provider || 'GOOGLE';
    const providerMap: Record<string, string> = {
      GOOGLE: 'Google',
      NAVER: 'Naver',
      KAKAO: 'Kakao',
      GITHUB: 'GitHub',
    };
    const provider = providerMap[rawProvider] || rawProvider;
    throw new Error(`해당 계정은 ${provider} 간편 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.`);
  }

  // 비밀번호 검증 (Bcrypt 또는 Plaintext fallback)
  let isMatch = false;
  try {
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
    }
  } catch {
    isMatch = user.password === password;
  }

  if (!isMatch) {
    throw new Error('Invalid password');
  }

  // ✉️ 이메일 인증 완료 여부 확인 (Global DB에 등록된 경우)
  if (globalUser && globalUser.isEmailVerified === false) {
    return {
      message: '이메일 인증이 완료되지 않았습니다. 인증코드를 확인해주세요.',
      requireVerification: true,
      email: user.email,
    };
  }

  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    message: '로그인 성공',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      isEmailVerified: globalUser ? globalUser.isEmailVerified : true,
    },
  };
};
