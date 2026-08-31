// -*- coding: utf-8 -*-
import {
  PrismaClient as WorkspacePrismaClient,
  Prisma as WorkspacePrisma,
} from '../generated/workspace-client/index.js';

export const getPrismaClient = () => {
  const dbUrl =
    process.env.WORKSPACE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'file:C:/Users/admin/antigravity-workflow/workflow_server/.tmp/workspaces/default.db';

  return new WorkspacePrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });
};

export const prisma = getPrismaClient();

// ⭐️ 트랜잭션 클라이언트 및 유니온 타입 별칭
export type PrismaTx = WorkspacePrisma.TransactionClient;
export type PrismaClientOrTx = WorkspacePrismaClient | PrismaTx;

/**
 * ⭐️ 다중 도메인 Interactive Transaction 실행 헬퍼
 * 기본 타임아웃 10초, 대기 시간 5초로 안전하게 트랜잭션을 실행합니다.
 */
export const runTransaction = async <T>(
  action: (tx: PrismaTx) => Promise<T>,
  options?: { maxWait?: number; timeout?: number; isolationLevel?: WorkspacePrisma.TransactionIsolationLevel }
): Promise<T> => {
  return await prisma.$transaction(action, {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 10000,
    isolationLevel: options?.isolationLevel,
  });
};
