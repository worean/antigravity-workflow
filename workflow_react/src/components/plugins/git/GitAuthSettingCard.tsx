import React from 'react';
import { AlertCircle, Check, Loader2, ShieldCheck } from 'lucide-react';
import type { GitPluginConfig } from '@/api/gitPlugin';

interface GitAuthSettingCardProps {
  provider: 'GITHUB' | 'GITLAB';
  onProviderChange: (provider: 'GITHUB' | 'GITLAB') => void;
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  tokenInput: string;
  onTokenInputChange: (token: string) => void;
  isEditingToken: boolean;
  onStartEditingToken: () => void;
  config?: GitPluginConfig;
  autoClose: boolean;
  onAutoCloseChange: (autoClose: boolean) => void;
  testResult: { success?: boolean; message?: string } | null;
  onTestConnection: () => void;
  isTesting: boolean;
}

export const GitAuthSettingCard: React.FC<GitAuthSettingCardProps> = ({
  provider,
  onProviderChange,
  serverUrl,
  onServerUrlChange,
  tokenInput,
  onTokenInputChange,
  isEditingToken,
  onStartEditingToken,
  config,
  autoClose,
  onAutoCloseChange,
  testResult,
  onTestConnection,
  isTesting,
}) => {
  const isFineGrained =
    tokenInput.trim().startsWith('github_pat_') ||
    (!isEditingToken && config?.maskedToken?.startsWith('github_pat_'));
  const isClassic =
    tokenInput.trim().startsWith('ghp_') ||
    (!isEditingToken && config?.maskedToken?.startsWith('ghp_'));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
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
        인증 및 Provider 설정
      </div>

      {/* Provider Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>
          Git Provider 선택
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['GITHUB', 'GITLAB'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onProviderChange(p)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: provider === p ? 600 : 400,
                backgroundColor: provider === p ? 'var(--primary)' : 'var(--bg-input)',
                color: provider === p ? 'var(--text-on-primary)' : 'var(--text-main)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              {p === 'GITHUB' ? 'GitHub (github.com)' : 'GitLab (SaaS / Self-hosted)'}
            </button>
          ))}
        </div>
      </div>

      {/* GitLab Server URL (GitLab 전용) */}
      {provider === 'GITLAB' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>
            GitLab Server URL
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => onServerUrlChange(e.target.value)}
            placeholder="https://gitlab.com 또는 https://gitlab.mycompany.com"
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Personal Access Token (PAT) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>
              Personal Access Token (PAT)
            </label>
            {provider === 'GITHUB' && (
              <>
                {isFineGrained && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      fontWeight: 600,
                    }}
                  >
                    Fine-grained PAT
                  </span>
                )}
                {isClassic && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      fontWeight: 600,
                    }}
                  >
                    Classic PAT
                  </span>
                )}
              </>
            )}
          </div>
          {config?.hasToken && !isEditingToken && (
            <button
              type="button"
              onClick={onStartEditingToken}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              토큰 재설정
            </button>
          )}
        </div>

        {config?.hasToken && !isEditingToken ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--secondary)' }} />
            <span>{config.maskedToken}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-sub)', marginLeft: 'auto' }}>
              암호화 저장됨
            </span>
          </div>
        ) : (
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => onTokenInputChange(e.target.value)}
            placeholder={
              provider === 'GITHUB'
                ? 'github_pat_... (권장) 또는 ghp_...'
                : 'glpat-xxxxxxxxxxxxxxxxxxxx'
            }
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
        )}

        {/* GitHub Fine-grained PAT 안내 및 필수 권한 가이드 */}
        {provider === 'GITHUB' && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '11px',
              color: 'var(--text-sub)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
              💡 GitHub Fine-grained PAT 지원 (권장 권한):
            </div>
            <div>• 저장소 접근: <b>All repositories</b> 또는 대상 리포지토리 선택</div>
            <div>
              • 권한(Permissions): <b>Contents</b>(Read & Write), <b>Pull requests</b>(Read & Write),{' '}
              <b>Metadata</b>(Read-only)
            </div>
          </div>
        )}
      </div>

      {/* Connection Test Button & Feedback */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onTestConnection}
          disabled={isTesting || (!tokenInput && !config?.hasToken)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: 'var(--bg-card-hover)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-bright)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {isTesting && <Loader2 size={13} className="animate-spin" />}
          <span>연결 테스트</span>
        </button>

        {testResult && (
          <span
            style={{
              fontSize: '12px',
              color: testResult.success ? 'var(--secondary)' : 'var(--accent-rose)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {testResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
            {testResult.message}
          </span>
        )}
      </div>

      {/* Auto-Close on Merge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
        <input
          type="checkbox"
          id="autoCloseCheck"
          checked={autoClose}
          onChange={(e) => onAutoCloseChange(e.target.checked)}
          style={{ accentColor: 'var(--primary)' }}
        />
        <label
          htmlFor="autoCloseCheck"
          style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}
        >
          PR / Merge Request가 머지되면 연결된 일감 상태를 자동으로 'Done'으로 변경
        </label>
      </div>
    </div>
  );
};
