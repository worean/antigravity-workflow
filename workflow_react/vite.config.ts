import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:4000',
        changeOrigin: true,
        secure: false, // 개발용 자승 인증서(SSL) 허용
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('socket.io-client') || id.includes('axios')) {
              return 'vendor-net';
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'vendor-markdown';
            }
            return 'vendor-common';
          }
        },
      },
    },
  },
});
