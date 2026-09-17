import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ModalWrapper, Button } from './common';
import { GoogleLoginButton, EmailOtpVerificationForm } from './auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'VERIFY_OTP';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, verifyEmail, resendVerification, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState<string>('worean@naver.com');
  const [password, setPassword] = useState<string>('password123');
  const [name, setName] = useState<string>('관리자');
  const [otpCode, setOtpCode] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  // 재발송 쿨다운 타이머 (초)
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const isPasswordValid = password.length >= 6;

  // 일반 로그인 / 가입 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (mode === 'LOGIN') {
        const res = await login(email, password);
        if (res?.requireVerification) {
          setMode('VERIFY_OTP');
          setSuccessMsg('이메일 인증이 필요합니다. 6자리 인증코드를 입력해주세요.');
        } else {
          onClose();
        }
      } else if (mode === 'SIGNUP') {
        if (!isPasswordValid) {
          setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
          setSubmitting(false);
          return;
        }
        const res = await signup(email, name, password);
        if (res?.requireVerification) {
          setMode('VERIFY_OTP');
          setCooldown(60);
          setSuccessMsg('회원가입 요청 완료! 이메일로 발송된 6자리 인증코드를 입력해주세요.');
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message || '인증 처리 실패');
    } finally {
      setSubmitting(false);
    }
  };

  // OTP 인증 완료
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (otpCode.trim().length !== 6) {
      setErrorMsg('6자리 인증 번호를 정확히 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await verifyEmail(email, otpCode.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || '인증 실패');
    } finally {
      setSubmitting(false);
    }
  };

  // 인증코드 재발송
  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const msg = await resendVerification(email);
      setSuccessMsg(msg);
      setCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || '재발송 실패');
    }
  };

  const getTitle = () => {
    if (mode === 'LOGIN') return '로그인 (Sign In)';
    if (mode === 'SIGNUP') return '회원가입 (Sign Up)';
    return '이메일 인증 (Verify Email)';
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={getTitle()} maxWidth="400px">
      {/* Tab Switcher */}
      {mode !== 'VERIFY_OTP' && (
        <div
          style={{
            display: 'flex',
            background: '#252526',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '2px',
            marginBottom: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '6px',
              border: 'none',
              borderRadius: '2px',
              background: mode === 'LOGIN' ? '#37373d' : 'transparent',
              color: mode === 'LOGIN' ? '#ffffff' : 'var(--text-sub)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => { setMode('SIGNUP'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '6px',
              border: 'none',
              borderRadius: '2px',
              background: mode === 'SIGNUP' ? '#37373d' : 'transparent',
              color: mode === 'SIGNUP' ? '#ffffff' : 'var(--text-sub)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            회원가입
          </button>
        </div>
      )}

      {/* 성공/에러 메시지 */}
      {successMsg && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-xs)',
            color: '#10b981',
            fontSize: '0.78rem',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <CheckCircle2 size={14} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(241, 76, 76, 0.15)',
            border: '1px solid rgba(241, 76, 76, 0.3)',
            borderRadius: 'var(--radius-xs)',
            color: '#f14c4c',
            fontSize: '0.78rem',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Google OAuth 로그인 버튼 */}
      {mode !== 'VERIFY_OTP' && (
        <GoogleLoginButton
          onSuccess={async (accessToken) => {
            await loginWithGoogle(accessToken);
            onClose();
          }}
          onError={(err) => setErrorMsg(err)}
          isLoading={googleLoading}
          setIsLoading={setGoogleLoading}
        />
      )}

      {/* 2. 일반 폼 또는 OTP 폼 */}
      {mode !== 'VERIFY_OTP' ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mode === 'SIGNUP' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>이름</label>
              <input
                type="text"
                className="input-field"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>이메일</label>
            <input
              type="email"
              className="input-field"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>비밀번호</label>
              {mode === 'SIGNUP' && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: isPasswordValid ? '#10b981' : 'var(--text-muted)',
                  }}
                >
                  {isPasswordValid ? '✓ 최소 6자 충족' : '최소 6자 이상'}
                </span>
              )}
            </div>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            icon={mode === 'LOGIN' ? <LogIn size={14} /> : <UserPlus size={14} />}
            style={{ marginTop: '6px', height: '32px', width: '100%' }}
          >
            {mode === 'LOGIN' ? '로그인' : '회원가입 요청'}
          </Button>
        </form>
      ) : (
        <EmailOtpVerificationForm
          email={email}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          submitting={submitting}
          cooldown={cooldown}
          onVerify={handleVerifyOtp}
          onResend={handleResend}
          onBackToLogin={() => { setMode('LOGIN'); setErrorMsg(''); setSuccessMsg(''); }}
        />
      )}
    </ModalWrapper>
  );
};
