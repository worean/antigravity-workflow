// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import {
  takeDbSnapshot,
  restoreDbSnapshot,
  cleanupSnapshot,
  ensureTmpDir,
} from '#lib/dbSnapshot.js';
import path from 'path';
import fs from 'fs';

describe('🧪 [DB Snapshot & Rollback System] Tests', () => {
  const customSnapshotPath = path.resolve(process.cwd(), '.tmp/custom_test.db.snapshot');

  beforeEach(() => {
    ensureTmpDir();
    if (fs.existsSync(customSnapshotPath)) {
      try {
        fs.unlinkSync(customSnapshotPath);
      } catch {
        // 무시
      }
    }
  });

  it('1️⃣ DB 스냅샷(Snapshot)을 생성하고 백업 파일이 존재하는지 확인한다', async () => {
    const currentDbPath = path.resolve(process.cwd(), '.tmp/test_task_board.db');
    const snapshotCreated = takeDbSnapshot(currentDbPath, customSnapshotPath);
    
    expect(snapshotCreated).toBe(true);
    expect(fs.existsSync(customSnapshotPath)).toBe(true);
    
    const stats = fs.statSync(customSnapshotPath);
    expect(stats.size).toBeGreaterThan(0);
  });

  it('2️⃣ 데이터 변경(새 유저 생성) 후 스냅샷 복원 시 이전 상태로 완벽히 롤백된다', async () => {
    const currentDbPath = path.resolve(process.cwd(), '.tmp/test_task_board.db');
    
    // Step 1: 변경 전 스냅샷 생성
    takeDbSnapshot(currentDbPath, customSnapshotPath);
    const initialUserCount = await prisma.user.count();

    // Step 2: 임의의 더미 유저 3명 추가
    const timestamp = Date.now();
    await prisma.user.create({
      data: {
        email: `dummy_snap_1_${timestamp}@example.com`,
        name: 'Snapshot Test User 1',
        password: 'password123',
      }
    });
    await prisma.user.create({
      data: {
        email: `dummy_snap_2_${timestamp}@example.com`,
        name: 'Snapshot Test User 2',
        password: 'password123',
      }
    });

    const modifiedUserCount = await prisma.user.count();
    expect(modifiedUserCount).toBe(initialUserCount + 2);

    // Step 3: Prisma 연결 잠시 끊고 스냅샷 복원(Rollback)
    await prisma.$disconnect();
    const restored = restoreDbSnapshot(customSnapshotPath, currentDbPath);
    expect(restored).toBe(true);

    // Step 4: 복원 후 유저 수가 정확히 이전(initialUserCount)으로 돌아왔는지 확인
    const rolledBackUserCount = await prisma.user.count();
    expect(rolledBackUserCount).toBe(initialUserCount);

    const checkDummyUser = await prisma.user.findFirst({
      where: { email: { contains: `dummy_snap_` } }
    });
    expect(checkDummyUser).toBeNull();
  });
});
