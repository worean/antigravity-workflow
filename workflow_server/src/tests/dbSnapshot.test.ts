// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  takeDbSnapshot,
  restoreDbSnapshot,
  ensureTmpDir,
} from '#lib/dbSnapshot.js';
import path from 'path';
import fs from 'fs';

describe('🧪 [DB Snapshot & Rollback System] Tests', () => {
  const dummySourceDb = path.resolve(process.cwd(), '.tmp/dummy_test_source.db');
  const customSnapshotPath = path.resolve(process.cwd(), '.tmp/custom_test.db.snapshot');
  const dummyTargetDb = path.resolve(process.cwd(), '.tmp/dummy_test_target.db');

  beforeEach(() => {
    ensureTmpDir();
    fs.writeFileSync(dummySourceDb, 'DUMMY_DATABASE_CONTENT_TEST');
    if (fs.existsSync(customSnapshotPath)) {
      try {
        fs.unlinkSync(customSnapshotPath);
      } catch {
        // 무시
      }
    }
    if (fs.existsSync(dummyTargetDb)) {
      try {
        fs.unlinkSync(dummyTargetDb);
      } catch {
        // 무시
      }
    }
  });

  afterEach(() => {
    try {
      if (fs.existsSync(dummySourceDb)) fs.unlinkSync(dummySourceDb);
      if (fs.existsSync(customSnapshotPath)) fs.unlinkSync(customSnapshotPath);
      if (fs.existsSync(dummyTargetDb)) fs.unlinkSync(dummyTargetDb);
    } catch {
      // 무시
    }
  });

  it('1️⃣ DB 스냅샷(Snapshot)을 생성하고 백업 파일이 존재하는지 확인한다', async () => {
    const snapshotCreated = takeDbSnapshot(dummySourceDb, customSnapshotPath);
    
    expect(snapshotCreated).toBe(true);
    expect(fs.existsSync(customSnapshotPath)).toBe(true);
    
    const content = fs.readFileSync(customSnapshotPath, 'utf8');
    expect(content).toBe('DUMMY_DATABASE_CONTENT_TEST');
  });

  it('2️⃣ 스냅샷 복원(Rollback) 시 대상 경로로 파일 내용이 완벽히 복구된다', async () => {
    takeDbSnapshot(dummySourceDb, customSnapshotPath);
    expect(fs.existsSync(customSnapshotPath)).toBe(true);

    const restored = restoreDbSnapshot(customSnapshotPath, dummyTargetDb);
    expect(restored).toBe(true);
    expect(fs.existsSync(dummyTargetDb)).toBe(true);

    const restoredContent = fs.readFileSync(dummyTargetDb, 'utf8');
    expect(restoredContent).toBe('DUMMY_DATABASE_CONTENT_TEST');
  });
});
