import { defineConfig } from 'vitest/config';
import path from 'path';

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
  },
});
