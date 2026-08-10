import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('admin@antigravity.io');
  const [password, setPassword] = useState<string>('password123');
  const [name, setName] = useState<string>('관리자');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {isLoginTab ? '로그인 (Login)' : '회원가입 (Sign Up)'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={() => { setIsLoginTab(true); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              background: isLoginTab ? 'var(--primary)' : 'transparent',
              color: isLoginTab ? '#ffffff' : 'var(--text-sub)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            로그인
          </button>
          <button
            onClick={() => { setIsLoginTab(false); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              background: !isLoginTab ? 'var(--primary)' : 'transparent',
              color: !isLoginTab ? '#ffffff' : 'var(--text-sub)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            회원가입
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#f43f5e',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLoginTab && (
            <div className="form-group">
              <label className="form-label">이름 (Name)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">이메일 (Email)</label>
            <input
              type="email"
              className="input-field"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호 (Password)</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
          >
            {isLoginTab ? (
              <>
                <LogIn size={18} /> {submitting ? '로그인 중...' : '로그인'}
              </>
            ) : (
              <>
                <UserPlus size={18} /> {submitting ? '가입 중...' : '회원가입하기'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
