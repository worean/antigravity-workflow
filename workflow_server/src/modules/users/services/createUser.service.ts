// -*- coding: utf-8 -*-
import bcrypt from 'bcryptjs';
import { prisma } from '#lib/prisma.js';

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

  return await prisma.user.create({
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
};
