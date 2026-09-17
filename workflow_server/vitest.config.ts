import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// 🧪 테스트 전용 .env.test 강제 로드 (개발용 DB 접근 원천 차단)
dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: true });

export default defineConfig({
  resolve: {
    alias: [
      { find: /^#lib\/(.*)\.js$/, replacement: path.resolve(__dirname, './src/lib/$1.ts') },
      { find: /^#lib\/(.*)$/, replacement: path.resolve(__dirname, './src/lib/$1') },
      { find: /^#modules\/(.*)\.js$/, replacement: path.resolve(__dirname, './src/modules/$1.ts') },
      { find: /^#modules\/(.*)$/, replacement: path.resolve(__dirname, './src/modules/$1') },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    globalSetup: ['./src/tests/globalSetup.ts'],
    setupFiles: ['./src/tests/setup.ts'],
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    env: {
      NODE_ENV: 'test',
      GLOBAL_DATABASE_URL: 'postgresql://juyeong:qkrwndud@localhost:5432/global_test',
      WORKSPACE_DATABASE_URL: 'postgresql://juyeong:qkrwndud@localhost:5432/workspace_test',
      DATABASE_URL: 'postgresql://juyeong:qkrwndud@localhost:5432/workspace_test',
      TASK_STORAGE_MODE: 'postgresql',
      JWT_SECRET: 'antigravity-test-jwt-secret-key-2026',
    },
  },
});
