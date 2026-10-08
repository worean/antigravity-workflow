import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawTarget =
    env.VITE_API_URL ||
    env.API_URL ||
    env.VITE_API_BASE_URL?.replace(/\/api\/?$/i, '') ||
    'https://localhost:4000';
  const backendTarget = rawTarget.replace(/\/+$/, '');

  return {
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false, // 개발용 자체 서명 인증서(SSL) 허용
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              if (res && 'writeHead' in res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    status: 'OFFLINE',
                    error: 'Backend proxy error: server unreachable or initializing',
                    detail: err.message,
                    timestamp: new Date().toISOString(),
                  })
                );
              }
            });
          },
        },
        '/socket.io': {
          target: backendTarget,
          changeOrigin: true,
          ws: true, // WebSocket 프로토콜 업그레이드 지원
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (_err, _req) => {
              // Socket 연결 시도 시 백엔드 미구동에 의한 크래시 방지
            });
          },
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
  };
});
