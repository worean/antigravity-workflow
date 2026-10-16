import React from 'react';
import { GitFork, Lock, Globe, ExternalLink, Plus, Check, Loader2 } from 'lucide-react';
import type { GitRemoteRepoItem } from '@/api/gitPlugin';

interface GitRemoteRepoCardProps {
  repo: GitRemoteRepoItem;
  projectId?: number;
  onMapRepo: (repoIdentifier: string, defaultBranch: string) => Promise<void>;
  isMapping?: boolean;
}

export const GitRemoteRepoCard: React.FC<GitRemoteRepoCardProps> = ({
  repo,
  projectId,
  onMapRepo,
  isMapping = false,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || repo.isMappedToCurrentProject || isMapping) return;
    await onMapRepo(repo.fullName, repo.defaultBranch || 'main');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 14px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <GitFork size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-bright)',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={repo.fullName}
          >
            {repo.fullName}
          </span>

          {repo.isPrivate ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-rose)',
                color: 'var(--accent-rose)',
                fontSize: '10px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <Lock size={10} /> Private
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-sub)',
                fontSize: '10px',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              <Globe size={10} /> Public
            </span>
          )}
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {repo.webUrl && (
            <a
              href={repo.webUrl}
              target="_blank"
              rel="noreferrer"
              title="원격 저장소 웹페이지 열기"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-sub)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
              }}
            >
              <ExternalLink size={12} />
            </a>
          )}

          {projectId && (
            <>
              {repo.isMappedToCurrentProject ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: 'var(--secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  <Check size={12} /> 현재 프로젝트 연결됨
                </span>
              ) : repo.isMapped ? (
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                  }}
                  title={`[${repo.mappedProjectKey}] ${repo.mappedProjectName || ''} 프로젝트에 연결됨`}
                >
                  [{repo.mappedProjectKey}] 연결됨
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isMapping}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--text-on-primary)',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: isMapping ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isMapping ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  <span>이 프로젝트에 연결</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {repo.description && (
        <div style={{ fontSize: '12px', color: 'var(--text-sub)', lineHeight: '1.4' }}>
          {repo.description}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>기본 브랜치: <code>{repo.defaultBranch}</code></span>
        <span>•</span>
        <span>최근 활동: {formatDate(repo.updatedAt)}</span>
      </div>
    </div>
  );
};
