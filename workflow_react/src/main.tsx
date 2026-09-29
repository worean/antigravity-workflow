import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from '@/App.tsx';
import './index.css';
import { initTheme } from '@/utils/themeUtils';
import { usePrefStore } from '@/stores/usePrefStore';

// 앱 시작 시 저장된 테마 즉각 초기화 (FOUC 방지)
try {
  const savedState = usePrefStore.getState();
  initTheme(savedState.theme || 'dark');
} catch (e) {
  initTheme('dark');
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-google-client-id';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
