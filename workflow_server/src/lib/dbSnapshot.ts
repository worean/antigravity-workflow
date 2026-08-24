// -*- coding: utf-8 -*-
import fs from 'fs';
import path from 'path';

const TMP_DIR = path.resolve(process.cwd(), '.tmp');
const MAIN_DB_PATH = path.resolve(TMP_DIR, 'task_board.db');
const TEST_DB_PATH = path.resolve(TMP_DIR, 'test_task_board.db');
const SNAPSHOT_DB_PATH = path.resolve(TMP_DIR, 'task_board.db.snapshot');

/**
 * .tmp 디렉터리 존재 여부 확인 및 생성
 */
export const ensureTmpDir = () => {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
};

/**
 * 대상 DB의 스냅샷(복사본)을 생성합니다.
 */
export const takeDbSnapshot = (sourcePath = MAIN_DB_PATH, targetSnapshotPath = SNAPSHOT_DB_PATH) => {
  ensureTmpDir();
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetSnapshotPath);
    return true;
  }
  return false;
};

/**
 * 스냅샷 파일로부터 DB를 원상복구(Restore)합니다.
 */
export const restoreDbSnapshot = (snapshotPath = SNAPSHOT_DB_PATH, targetPath = MAIN_DB_PATH) => {
  ensureTmpDir();
  if (fs.existsSync(snapshotPath)) {
    fs.copyFileSync(snapshotPath, targetPath);
    return true;
  }
  return false;
};

/**
 * 테스트용 격리 DB 파일(.tmp/test_task_board.db)을 메인 DB 또는 스냅샷으로부터 생성합니다.
 */
export const createTestDbCopy = () => {
  ensureTmpDir();
  const source = fs.existsSync(MAIN_DB_PATH) ? MAIN_DB_PATH : (fs.existsSync(SNAPSHOT_DB_PATH) ? SNAPSHOT_DB_PATH : null);
  if (source) {
    fs.copyFileSync(source, TEST_DB_PATH);
    return TEST_DB_PATH;
  }
  return null;
};

/**
 * 테스트용 격리 DB 파일 및 저널/WAL 파일들을 정리합니다.
 */
export const cleanupTestDb = () => {
  const filesToDelete = [
    TEST_DB_PATH,
    `${TEST_DB_PATH}-journal`,
    `${TEST_DB_PATH}-wal`,
    `${TEST_DB_PATH}-shm`,
  ];

  for (const f of filesToDelete) {
    if (fs.existsSync(f)) {
      try {
        fs.unlinkSync(f);
      } catch {
        // 파일 잠금 등으로 즉시 삭제되지 않을 경우 안전 무시
      }
    }
  }
};

/**
 * 스냅샷 임시 파일을 정리합니다.
 */
export const cleanupSnapshot = () => {
  if (fs.existsSync(SNAPSHOT_DB_PATH)) {
    try {
      fs.unlinkSync(SNAPSHOT_DB_PATH);
    } catch {
      // 안전 무시
    }
  }
};
