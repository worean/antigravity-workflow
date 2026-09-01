import path from 'path';
import { afterAll } from 'vitest';
import { prisma } from '#lib/prisma.js';

// 각 테스트 워커 실행 시 DATABASE_URL을 테스트 DB 경로로 명시적 고정
const TEST_DB_PATH = path.resolve(process.cwd(), '.tmp/test_task_board.db');
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

// 각 테스트 파일 실행 완료 시 Prisma 커넥션 정리
afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // 무시
  }
});
