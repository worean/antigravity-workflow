import { PrismaClient } from '@prisma/client';

export const getPrismaClient = () => {
  return new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? {
          db: {
            url: process.env.DATABASE_URL,
          },
        }
      : undefined,
  });
};

export const prisma = getPrismaClient();

