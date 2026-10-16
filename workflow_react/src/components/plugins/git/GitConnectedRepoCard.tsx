import React, { useState } from 'react';
import { GitBranch, ExternalLink, Trash2, CheckCircle2, History } from 'lucide-react';
import type { GitRepoMapping, GitPluginConfig } from '@/api/gitPlugin';
import { GitLogViewerModal } from './GitLogViewerModal';

interface GitConnectedRepoCardProps {
  mapping: GitRepoMapping;
  config?: GitPluginConfig;
  onDeleteMapping?: (id: number) => void;
  showDelete?: boolean;
}

export const GitConnectedRepoCard: React.FC<GitConnectedRepoCardProps> = ({
  mapping,
  config,
  onDeleteMapping,
  showDelete = true,
}) => {
  const [showLogModal, setShowLogModal] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  const getWebUrl = () => {
    if (config?.provider === 'GITLAB') {
      const serverUrl = config.serverUrl ? config.serverUrl.replace(/\/$/, '') : 'https://gitlab.com';
      return `${serverUrl}/${mapping.repoIdentifier}`;
    }
    return `https://github.com/${mapping.repoIdentifier}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <CheckCircle2 size={16} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            >
              {mapping.repoIdentifier}
            </span>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--primary)',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              연결 활성
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-sub)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <GitBranch size={11} />
              <code>{mapping.defaultBranch}</code>
            </span>
            <span>•</span>
            <span>연결일: {formatDate(mapping.createdAt)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          title="Git 로그 및 커밋 히스토리 확인"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--primary)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          }}
        >
          <History size={12} />
          <span>Git 로그</span>
        </button>

        <a
          href={getWebUrl()}
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

        {showDelete && onDeleteMapping && (
          <button
            type="button"
            onClick={() => onDeleteMapping(mapping.id)}
            title="저장소 연결 해제"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Git 로그 타임라인 및 커밋 Diff 뷰어 모달 */}
      <GitLogViewerModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        repoMappingId={mapping.id}
        repoIdentifier={mapping.repoIdentifier}
        defaultBranch={mapping.defaultBranch}
      />
    </div>
  );
};
