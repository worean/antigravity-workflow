// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  avatar?: string | null;
  avatarColor?: string | null;
  pushToken?: string | null;
  preferences?: string | null;
}

export const updateUserService = async (id: number, data: UpdateUserInput) => {
  if (!id) throw new Error('User ID is required');
  return await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      avatarColor: true,
      pushToken: true,
      preferences: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};


