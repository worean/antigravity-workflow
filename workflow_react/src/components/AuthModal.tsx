import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import { ModalWrapper, Button } from './common';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('worean@naver.com');
  const [password, setPassword] = useState<string>('password123');
  const [name, setName] = useState<string>('관리자');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        await signup(email, name, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message || '인증 처리 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isLoginTab ? '로그인 (Login)' : '회원가입 (Sign Up)'}
      maxWidth="380px"
    >
      {/* Tab switcher */}
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
          onClick={() => { setIsLoginTab(true); setErrorMsg(''); }}
          style={{
            flex: 1,
            padding: '4px',
            border: 'none',
            borderRadius: '2px',
            background: isLoginTab ? '#37373d' : 'transparent',
            color: isLoginTab ? '#ffffff' : 'var(--text-sub)',
            fontWeight: 500,
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => { setIsLoginTab(false); setErrorMsg(''); }}
          style={{
            flex: 1,
            padding: '4px',
            border: 'none',
            borderRadius: '2px',
            background: !isLoginTab ? '#37373d' : 'transparent',
            color: !isLoginTab ? '#ffffff' : 'var(--text-sub)',
            fontWeight: 500,
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          회원가입
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '6px 10px',
            background: 'rgba(241, 76, 76, 0.15)',
            border: '1px solid rgba(241, 76, 76, 0.3)',
            borderRadius: 'var(--radius-xs)',
            color: '#f14c4c',
            fontSize: '0.75rem',
            marginBottom: '10px',
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!isLoginTab && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">이름</label>
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
          <label className="form-label">이메일</label>
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
          <label className="form-label">비밀번호</label>
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
          fullWidth
          size="sm"
          isLoading={submitting}
          icon={isLoginTab ? <LogIn size={13} /> : <UserPlus size={13} />}
          style={{ marginTop: '6px', height: '28px' }}
        >
          {isLoginTab ? '로그인' : '회원가입'}
        </Button>
      </form>
    </ModalWrapper>
  );
};
