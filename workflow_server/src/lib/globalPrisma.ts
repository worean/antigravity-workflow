// -*- coding: utf-8 -*-
import { PrismaClient as GlobalPrismaClient, Prisma as GlobalPrisma } from '../generated/global-client/index.js';

export const getGlobalPrismaClient = () => {
  return new GlobalPrismaClient({
    datasources: process.env.GLOBAL_DATABASE_URL
      ? {
          db: {
            url: process.env.GLOBAL_DATABASE_URL,
          },
        }
      : undefined,
  });
};

export const globalPrisma = getGlobalPrismaClient();

export type GlobalPrismaTx = GlobalPrisma.TransactionClient;
export type GlobalPrismaClientOrTx = GlobalPrismaClient | GlobalPrismaTx;

/**
 * 🌐 Global Database Transaction 실행 헬퍼
 */
export const runGlobalTransaction = async <T>(
  action: (tx: GlobalPrismaTx) => Promise<T>,
  options?: { maxWait?: number; timeout?: number; isolationLevel?: GlobalPrisma.TransactionIsolationLevel }
): Promise<T> => {
  return await globalPrisma.$transaction(action, {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 10000,
    isolationLevel: options?.isolationLevel,
  });
};
