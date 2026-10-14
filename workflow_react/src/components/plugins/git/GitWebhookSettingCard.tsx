import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface GitWebhookSettingCardProps {
  webhookUrl: string;
  webhookSecret?: string;
  onSecretChange?: (secret: string) => void;
}

export const GitWebhookSettingCard: React.FC<GitWebhookSettingCardProps> = ({
  webhookUrl,
  webhookSecret = '',
  onSecretChange,
}) => {
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const handleCopyWebhook = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-bright)',
          borderBottom: '1px solid var(--border-divider)',
          paddingBottom: '10px',
        }}
      >
        Webhook 연동 설정
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
        원격 리포지토리의 Webhook 설정에 아래 URL을 등록하면 커밋 푸시 및 PR 변경 이벤트가 실시간 반영됩니다.
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          readOnly
          value={webhookUrl}
          style={{
            flex: 1,
            padding: '8px 10px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-sub)',
            fontSize: '12px',
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={handleCopyWebhook}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-bright)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {copiedWebhook ? <Check size={14} style={{ color: 'var(--secondary)' }} /> : <Copy size={14} />}
          <span>{copiedWebhook ? '복사됨' : '복사'}</span>
        </button>
      </div>

      {onSecretChange && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>
            Webhook Secret Token (선택 사항)
          </label>
          <input
            type="password"
            value={webhookSecret}
            onChange={(e) => onSecretChange(e.target.value)}
            placeholder="외부 호출 검증용 시크릿 키"
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
};
