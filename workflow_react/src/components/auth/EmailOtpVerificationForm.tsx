import React from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '../common';

interface EmailOtpVerificationFormProps {
  email: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  submitting: boolean;
  cooldown: number;
  onVerify: (e: React.FormEvent) => void;
  onResend: () => void;
  onBackToLogin: () => void;
}

export const EmailOtpVerificationForm: React.FC<EmailOtpVerificationFormProps> = ({
  email,
  otpCode,
  setOtpCode,
  submitting,
  cooldown,
  onVerify,
  onResend,
  onBackToLogin,
}) => {
  return (
    <form onSubmit={onVerify} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
        <strong>{email}</strong> 주소로 전송된<br />6자리 인증 번호를 입력해주세요.
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <input
          type="text"
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="123456"
          style={{
            width: '200px',
            height: '42px',
            textAlign: 'center',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            letterSpacing: '6px',
            background: '#1e1e1e',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-xs)',
            color: '#ffffff',
          }}
          autoFocus
          required
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onResend}
          disabled={cooldown > 0}
          icon={<RefreshCw size={12} />}
          style={{ flex: 1, height: '32px' }}
        >
          {cooldown > 0 ? `재발송 (${cooldown}s)` : '코드 재발송'}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={submitting}
          icon={<ShieldCheck size={14} />}
          style={{ flex: 2, height: '32px' }}
        >
          인증 완료
        </Button>
      </div>

      <button
        type="button"
        onClick={onBackToLogin}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          cursor: 'pointer',
          textDecoration: 'underline',
          marginTop: '4px',
        }}
      >
        이전 로그인 화면으로 돌아가기
      </button>
    </form>
  );
};
