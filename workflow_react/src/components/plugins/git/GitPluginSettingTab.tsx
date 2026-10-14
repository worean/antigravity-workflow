import React, { useState, useEffect } from 'react';
import {
  Check,
  Plug,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  useGitConfig,
  useUpdateGitConfig,
  useTestGitConnection,
  useRepoMappings,
  useDeleteRepoMapping,
} from '@/api/gitPlugin';
import { GitRepoMappingModal } from './GitRepoMappingModal';
import { GitRepoMappingTable } from './GitRepoMappingTable';
import { GitWebhookSettingCard } from './GitWebhookSettingCard';

interface GitPluginSettingTabProps {
  projects?: Array<{ id: number; name: string; key: string }>;
}

export const GitPluginSettingTab: React.FC<GitPluginSettingTabProps> = ({ projects = [] }) => {
  const { data: config, isLoading: isConfigLoading } = useGitConfig();
  const { data: mappings = [], refetch: refetchMappings } = useRepoMappings();

  const updateConfigMutation = useUpdateGitConfig();
  const testConnMutation = useTestGitConnection();
  const deleteMappingMutation = useDeleteRepoMapping();

  const [isEnabled, setIsEnabled] = useState(false);
  const [provider, setProvider] = useState<'GITHUB' | 'GITLAB'>('GITHUB');
  const [serverUrl, setServerUrl] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [autoClose, setAutoClose] = useState(true);
  const [isEditingToken, setIsEditingToken] = useState(false);

  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (config) {
      setIsEnabled(config.isEnabled);
      setProvider(config.provider);
      setServerUrl(config.serverUrl || '');
      setWebhookSecret(config.webhookSecret || '');
      setAutoClose(config.autoCloseIssueOnMerge);
      setIsEditingToken(!config.hasToken);
    }
  }, [config]);

  const handleTestConnection = async () => {
    setTestResult(null);
    try {
      const res = await testConnMutation.mutateAsync({
        provider,
        token: tokenInput || (config?.hasToken ? '__SAVED_TOKEN__' : ''),
        serverUrl: provider === 'GITLAB' ? serverUrl : undefined,
      });
      setTestResult({ success: true, message: res.message });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || '연결 테스트에 실패했습니다.',
      });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfigMutation.mutateAsync({
        isEnabled,
        provider,
        serverUrl: provider === 'GITLAB' ? serverUrl : undefined,
        token: isEditingToken && tokenInput ? tokenInput : undefined,
        webhookSecret,
        autoCloseIssueOnMerge: autoClose,
      });
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
      if (tokenInput) {
        setTokenInput('');
        setIsEditingToken(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || '설정 저장에 실패했습니다.');
    }
  };

  const handleDeleteMapping = async (id: number) => {
    if (confirm('이 저장소 매핑을 해제하시겠습니까?')) {
      await deleteMappingMutation.mutateAsync(id);
    }
  };

  if (isConfigLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '8px', color: 'var(--text-sub)' }}>
        <Loader2 size={20} className="animate-spin" />
        <span>Git 플러그인 설정을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      {/* 1. 플러그인 마스터 활성화 카드 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isEnabled ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
              color: isEnabled ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <Plug size={24} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-bright)' }}>
              Git Integration Plugin (GitHub & GitLab)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '2px' }}>
              AntiGravity 일감과 소스코드 형상관리(PR, 브랜치, 커밋, CI/CD, 자동 완료)를 연동합니다.
            </div>
          </div>
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
          />
          <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 600, color: isEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
            {isEnabled ? '활성화됨' : '비활성화'}
          </span>
        </label>
      </div>

      {/* 2. 설정 폼 */}
      <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)', borderBottom: '1px solid var(--border-divider)', paddingBottom: '10px' }}>
            인증 및 Provider 설정
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>Git Provider 선택</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['GITHUB', 'GITLAB'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
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

          {provider === 'GITLAB' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>GitLab Server URL</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sub)' }}>Personal Access Token (PAT)</label>
              {config?.hasToken && !isEditingToken && (
                <button
                  type="button"
                  onClick={() => setIsEditingToken(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer' }}
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
                <span style={{ fontSize: '11px', color: 'var(--text-sub)', marginLeft: 'auto' }}>암호화 저장됨</span>
              </div>
            ) : (
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={provider === 'GITHUB' ? 'ghp_xxxxxxxxxxxxxxxxxxxx' : 'glpat-xxxxxxxxxxxxxxxxxxxx'}
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testConnMutation.isPending || (!tokenInput && !config?.hasToken)}
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
              {testConnMutation.isPending && <Loader2 size={13} className="animate-spin" />}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px' }}>
            <input
              type="checkbox"
              id="autoCloseCheck"
              checked={autoClose}
              onChange={(e) => setAutoClose(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <label htmlFor="autoCloseCheck" style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
              PR / Merge Request가 머지되면 연결된 일감 상태를 자동으로 'Done'으로 변경
            </label>
          </div>
        </div>

        {/* 3. 웹훅 안내 카드 */}
        <GitWebhookSettingCard
          webhookUrl={config?.webhookUrl || ''}
          webhookSecret={webhookSecret}
          onSecretChange={setWebhookSecret}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          {saveSuccessMsg && (
            <span style={{ color: 'var(--secondary)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Check size={14} /> 설정이 성공적으로 저장되었습니다.
            </span>
          )}
          <button
            type="submit"
            disabled={updateConfigMutation.isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-on-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: updateConfigMutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {updateConfigMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            <span>설정 저장</span>
          </button>
        </div>
      </form>

      {/* 4. 프로젝트 - 저장소 매핑 테이블 */}
      <GitRepoMappingTable
        mappings={mappings}
        onOpenAddModal={() => setIsMappingModalOpen(true)}
        onDeleteMapping={handleDeleteMapping}
      />

      <GitRepoMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        projects={projects}
        onSuccess={() => refetchMappings()}
      />
    </div>
  );
};
