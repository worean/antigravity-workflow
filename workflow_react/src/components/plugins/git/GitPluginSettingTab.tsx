import React, { useState, useEffect } from 'react';
import {
  Check,
  Plug,
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
import { GitAuthSettingCard } from './GitAuthSettingCard';

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
      const activeToken = tokenInput.trim() || (config?.hasToken ? '__SAVED_TOKEN__' : '');
      const res = await testConnMutation.mutateAsync({
        provider,
        token: activeToken,
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
      const sanitizedToken = isEditingToken && tokenInput.trim() && !tokenInput.includes('************')
        ? tokenInput.trim()
        : undefined;

      await updateConfigMutation.mutateAsync({
        isEnabled,
        provider,
        serverUrl: provider === 'GITLAB' ? serverUrl : '',
        token: sanitizedToken,
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
        {/* 2. 인증 및 Provider 설정 카드 (서브 컴포넌트) */}
        <GitAuthSettingCard
          provider={provider}
          onProviderChange={setProvider}
          serverUrl={serverUrl}
          onServerUrlChange={setServerUrl}
          tokenInput={tokenInput}
          onTokenInputChange={setTokenInput}
          isEditingToken={isEditingToken}
          onStartEditingToken={() => setIsEditingToken(true)}
          config={config}
          autoClose={autoClose}
          onAutoCloseChange={setAutoClose}
          testResult={testResult}
          onTestConnection={handleTestConnection}
          isTesting={testConnMutation.isPending}
        />

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
