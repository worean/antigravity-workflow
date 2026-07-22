import { prisma } from '#lib/prisma.js';

export const createUserService = async (data: { email: string; name?: string; password?: string }) => {
  const { email, name, password } = data;
  if (!email) throw new Error('Email is required');
  return await prisma.user.create({
    data: { email, name, password }
  });
};
