import bcrypt from 'bcryptjs';
import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';

export const createUserService = async (data: {
  email: string;
  name?: string;
  password?: string;
  avatar?: string;
  avatarColor?: string;
}) => {
  const { email, name, password, avatar, avatarColor } = data;
  if (!email) throw new Error('Email is required');

  let hashedPassword: string | undefined = undefined;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const role = email.trim().toLowerCase() === 'worean@naver.com' ? 'ADMIN' : 'MEMBER';

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
      avatar,
      avatarColor,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      avatarColor: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Global DB에도 동기화
  await globalPrisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email, name: user.name, avatar: user.avatar, role: user.role },
    create: {
      id: user.id,
      email: user.email,
      name: user.name,
      password: hashedPassword,
      role: user.role,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      isEmailVerified: true,
    },
  }).catch(() => {});

  return user;
};
