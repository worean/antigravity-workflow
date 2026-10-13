import './env.js';
import { PrismaClient as GlobalPrismaClient, Prisma as GlobalPrisma } from '../generated/global-client/index.js';

export const getGlobalPrismaClient = () => {
  const url = process.env.GLOBAL_DATABASE_URL;
  if (!url) {
    throw new Error(
      '❌ [GlobalPrisma] GLOBAL_DATABASE_URL 환경변수가 설정되지 않았습니다. .env 파일을 확인해 주세요.'
    );
  }

  return new GlobalPrismaClient({
    datasources: {
      db: {
        url,
      },
    },
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
