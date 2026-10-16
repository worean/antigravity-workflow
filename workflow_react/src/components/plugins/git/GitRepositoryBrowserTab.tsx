import React, { useState } from 'react';
import { GitFork, Plus, AlertCircle, History } from 'lucide-react';
import { useGitConfig, useRepoMappings, useDeleteRepoMapping, type GitRepoMapping } from '@/api/gitPlugin';
import { GitConnectedRepoCard } from './GitConnectedRepoCard';
import { GitRepositoryBrowserModal } from './GitRepositoryBrowserModal';
import { GitLogViewerModal } from './GitLogViewerModal';

interface GitRepositoryBrowserTabProps {
  projectId: number;
  projectKey: string;
  projectName: string;
}

export const GitRepositoryBrowserTab: React.FC<GitRepositoryBrowserTabProps> = ({
  projectId,
  projectKey,
  projectName,
}) => {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [activeLogMapping, setActiveLogMapping] = useState<GitRepoMapping | null>(null);
  const { data: config } = useGitConfig();
  const { data: mappings = [], refetch } = useRepoMappings(projectId);
  const deleteMappingMutation = useDeleteRepoMapping();

  const projectMappings = mappings.filter((m) => m.projectId === projectId);

  const handleDeleteMapping = async (id: number) => {
    if (confirm('이 저장소 매핑을 해제하시겠습니까?')) {
      await deleteMappingMutation.mutateAsync(id);
      refetch();
    }
  };

  if (!config?.isEnabled) {
    return null;
  }

  const providerName = config.provider === 'GITLAB' ? 'GitLab' : 'GitHub';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* 1. 상단 타이틀 및 원격 저장소 탐색기 호출 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitFork size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
            연동된 Git 리포지토리 ({projectMappings.length})
          </span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              color: 'var(--accent-cyan)',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            {providerName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {projectMappings.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveLogMapping(projectMappings[0])}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-cyan)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.22)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
              }}
            >
              <History size={13} />
              <span>통합 Git 로그 보기</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsBrowserOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-on-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            <span>전체 저장소 탐색 및 연결</span>
          </button>
        </div>
      </div>

      {/* 2. 연결된 저장소 카드 리스트 */}
      {projectMappings.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '28px 16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-light)',
            color: 'var(--text-sub)',
            gap: '8px',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={24} style={{ color: 'var(--accent-amber)' }} />
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            현재 프로젝트에 연결된 Git 저장소가 없습니다
          </div>
          <div style={{ fontSize: '12px' }}>
            우측 상단의 <b>[전체 저장소 탐색 및 연결]</b> 버튼을 눌러 {providerName}의 저장소를 원클릭으로 연결하세요.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projectMappings.map((m) => (
            <GitConnectedRepoCard
              key={m.id}
              mapping={m}
              config={config}
              onDeleteMapping={handleDeleteMapping}
              showDelete={true}
            />
          ))}
        </div>
      )}

      {/* 3. 전체 저장소 브라우저 팝업 모달 */}
      <GitRepositoryBrowserModal
        isOpen={isBrowserOpen}
        onClose={() => {
          setIsBrowserOpen(false);
          refetch();
        }}
        projectId={projectId}
        projectKey={projectKey}
        projectName={projectName}
      />

      {/* 4. Git 통합 로그 확인 팝업 모달 */}
      {activeLogMapping && (
        <GitLogViewerModal
          isOpen={true}
          onClose={() => setActiveLogMapping(null)}
          repoMappingId={activeLogMapping.id}
          repoIdentifier={activeLogMapping.repoIdentifier}
          defaultBranch={activeLogMapping.defaultBranch}
        />
      )}
    </div>
  );
};

