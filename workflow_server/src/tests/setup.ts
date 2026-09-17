import path from 'path';
import dotenv from 'dotenv';
import { afterAll } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

// 🧪 각 테스트 워커 프로세스별로 .env.test 로드 및 테스트 DB URL 고정
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

process.env.NODE_ENV = 'test';
process.env.GLOBAL_DATABASE_URL = 'postgresql://juyeong:qkrwndud@localhost:5432/global_test';
process.env.WORKSPACE_DATABASE_URL = 'postgresql://juyeong:qkrwndud@localhost:5432/workspace_test';
process.env.DATABASE_URL = 'postgresql://juyeong:qkrwndud@localhost:5432/workspace_test';
process.env.TASK_STORAGE_MODE = 'postgresql';

// 각 테스트 파일 실행 완료 시 Prisma 커넥션 정리
afterAll(async () => {
  try {
    await workspaceManager.closeAll();
    await prisma.$disconnect();
    await globalPrisma.$disconnect();
  } catch {
    // 무시
  }
});
