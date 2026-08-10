// -*- coding: utf-8 -*-
import bcrypt from 'bcryptjs';
import { prisma } from '#lib/prisma.js';

export const createUserService = async (data: { email: string; name?: string; password?: string }) => {
  const { email, name, password } = data;
  if (!email) throw new Error('Email is required');

  let hashedPassword: string | undefined = undefined;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  return await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true
    }
  });
};
