import React, { useState, useEffect } from 'react';
import { GoogleLoginCard } from './components/GoogleLoginCard';
import { Dashboard } from './components/Dashboard';

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('user_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 🌐 Google OAuth 리디렉션 수신 핸들러 (#access_token=... 또는 ?token=... / ?user=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tokenParam = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (tokenParam) {
      window.history.replaceState(null, '', window.location.pathname);
      try {
        const parsedUser = userParam ? JSON.parse(decodeURIComponent(userParam)) : { name: 'Google User' };
        handleLoginSuccess(tokenParam, parsedUser);
        return;
      } catch (e) {
        console.error('Failed to parse user param', e);
      }
    }

    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');

      if (accessToken) {
        // 주소창 URL 깨끗하게 정리
        window.history.replaceState(null, '', window.location.pathname);
        
        // 백엔드로 구글 access_token 전달 ➔ 백엔드 서명 JWT 토큰 수신
        setAuthLoading(true);
        fetch('http://localhost:4000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.token && data.user) {
              handleLoginSuccess(data.token, data.user);
            } else {
              setAuthError(data.error || '구글 연동 로그인에 실패했습니다.');
            }
          })
          .catch((err) => {
            setAuthError('백엔드 서버 연동 실패: ' + err.message);
          })
          .finally(() => {
            setAuthLoading(false);
          });
      }
    }
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('jwt_token', newToken);
    localStorage.setItem('user_info', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      {token && user ? (
        <Dashboard token={token} user={user} onLogout={handleLogout} />
      ) : (
        <GoogleLoginCard onLoginSuccess={handleLoginSuccess} loading={authLoading} error={authError} />
      )}
    </div>
  );
}
