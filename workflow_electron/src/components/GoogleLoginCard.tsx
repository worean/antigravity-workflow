import React, { useState } from 'react';

interface Props {
  onLoginSuccess: (token: string, user: any) => void;
  loading?: boolean;
  error?: string | null;
}

export const GoogleLoginCard: React.FC<Props> = ({ onLoginSuccess, loading = false, error: externalError }) => {
  const [googleToken, setGoogleToken] = useState('mock-google-access-token-demo');
  const [isManualMode, setIsManualMode] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '1072540179171-gn48l15h9vr6vnvu0c4m1fhudtn5f7o0.apps.googleusercontent.com';
  const redirectUri = (import.meta as any).env?.VITE_GOOGLE_REDIRECT_URL || window.location.origin;

  // 🌐 실제 구글 OAuth 2.0 인증 페이지로 이동
  const handleOpenGoogleAuth = () => {
    const scope = 'email profile openid';
    const responseType = redirectUri.includes('/callback') ? 'code' : 'token';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&prompt=select_account`;

    // Google OAuth 페이지로 이동
    window.location.href = authUrl;
  };

  // 🧪 수동 테스트 토큰 제출
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);

    try {
      const res = await fetch('http://localhost:4000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: googleToken })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google login failed');

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = externalError || localError;

  return (
    <div className="glass-panel" style={{ padding: '36px', maxWidth: '440px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '64px', height: '64px', background: 'linear-gradient(135deg, #4285F4, #34A853)',
          borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px auto', fontSize: '28px', fontWeight: 'bold', color: 'white',
          boxShadow: '0 8px 24px rgba(66, 133, 244, 0.3)'
        }}>
          G
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 600 }}>AntiGravity Workflow</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
          Google 계정 인증으로 안전하게 로그인하세요
        </p>
      </div>

      {displayError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px'
        }}>
          ⚠️ {displayError}
        </div>
      )}

      {/* 🚀 구글 OAuth 2.0 공식 로그인 버튼 */}
      <button
        onClick={handleOpenGoogleAuth}
        className="btn-gradient"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '14px',
          fontSize: '15px',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #4285F4 0%, #2b6cb0 100%)',
          cursor: 'pointer'
        }}
        disabled={loading || submitting}
      >
        {loading ? 'Google 인증 확인 중...' : '🌐 Google 계정으로 로그인'}
      </button>

      {/* 🛠️ 개발/수동 테스트용 폼 토글 */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button
          type="button"
          onClick={() => setIsManualMode(!isManualMode)}
          style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            fontSize: '12px', cursor: 'pointer', textDecoration: 'underline'
          }}
        >
          {isManualMode ? '닫기' : '🧪 개발자 수동 테스트 토큰 입력방식'}
        </button>
      </div>

      {isManualMode && (
        <form onSubmit={handleManualLogin} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              OAuth Access Token / Mock Token
            </label>
            <input
              type="text"
              className="input-field"
              value={googleToken}
              onChange={(e) => setGoogleToken(e.target.value)}
              placeholder="Token 입력"
              required
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
            {submitting ? '제출 중...' : '테스트 토큰으로 로그인'}
          </button>
        </form>
      )}
    </div>
  );
};

