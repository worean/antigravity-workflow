import path from 'path';
import fs from 'fs';
import {
  takeDbSnapshot,
  restoreDbSnapshot,
  createTestDbCopy,
  cleanupTestDb,
  cleanupSnapshot,
  ensureTmpDir,
} from '#lib/dbSnapshot.js';

const TMP_DIR = path.resolve(process.cwd(), '.tmp');
const TEST_DB_PATH = path.resolve(TMP_DIR, 'test_task_board.db');
const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

export async function setup() {
  ensureTmpDir();
  console.log('\n📦 [Test DB Setup] Creating database snapshot & isolated test database...');

  // 1. 메인 DB 스냅샷 백업
  const snapshotCreated = takeDbSnapshot();
  if (snapshotCreated) {
    console.log('📸 [Test DB Setup] Snapshot created: task_board.db.snapshot');
  }

  // 2. 테스트 전용 DB 복제본 생성
  const testDbCreated = createTestDbCopy();
  if (testDbCreated) {
    console.log(`🧪 [Test DB Setup] Test database prepared: ${testDbCreated}`);
  }

  // 3. 환경 변수 DATABASE_URL을 테스트 DB로 설정
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  console.log(`🔗 [Test DB Setup] DATABASE_URL routed to: ${TEST_DATABASE_URL}\n`);
}

export async function teardown() {
  console.log('\n🧹 [Test DB Teardown] Cleaning up test database and restoring snapshot...');

  // 1. 테스트용 임시 DB 정리
  cleanupTestDb();

  // 2. 메인 DB를 테스트 실행 직전의 스냅샷 상태로 완벽 복원
  const restored = restoreDbSnapshot();
  if (restored) {
    console.log('🔄 [Test DB Teardown] Main database successfully restored from snapshot!');
  }

  // 3. 임시 스냅샷 파일 정리
  cleanupSnapshot();
  console.log('✨ [Test DB Teardown] Completed cleanly. Main database is 100% preserved.\n');
}
