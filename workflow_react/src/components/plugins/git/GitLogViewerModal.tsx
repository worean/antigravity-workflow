import React, { useState } from 'react';
import { GitCommit, Search, RefreshCw, GitBranch, Loader2, FileDiff } from 'lucide-react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import { useRepoCommits, type GitCommitItem } from '@/api/gitPlugin';
import { GitCommitDetailModal } from './GitCommitDetailModal';

interface GitLogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableRepositories?: Array<{
    id: number;
    repoIdentifier: string;
    defaultBranch?: string;
  }>;
  initialRepoMappingId?: number;
  repoMappingId?: number;
  repoIdentifier?: string;
  defaultBranch?: string;
}

export const GitLogViewerModal: React.FC<GitLogViewerModalProps> = ({
  isOpen,
  onClose,
  availableRepositories = [],
  initialRepoMappingId,
  repoMappingId,
  repoIdentifier,
  defaultBranch,
}) => {
  const repos =
    availableRepositories.length > 0
      ? availableRepositories
      : repoMappingId
      ? [{ id: repoMappingId, repoIdentifier: repoIdentifier || '', defaultBranch: defaultBranch || 'main' }]
      : [];

  const [selectedRepoId, setSelectedRepoId] = useState<number>(
    repoMappingId || initialRepoMappingId || repos[0]?.id || 0
  );
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCommit, setSelectedCommit] = useState<GitCommitItem | null>(null);

  const currentRepo = repos.find((r) => r.id === selectedRepoId) || repos[0];
  const activeBranch = selectedBranch || currentRepo?.defaultBranch || 'main';

  const {
    data: commitsData,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useRepoCommits(
    currentRepo?.id,
    activeBranch,
    1,
    50,
    isOpen && Boolean(currentRepo?.id)
  );

  const commits = commitsData?.commits || [];

  const filteredCommits = commits.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.commitHash.toLowerCase().includes(term) ||
      c.message.toLowerCase().includes(term) ||
      c.authorName.toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCommit size={18} style={{ color: 'var(--primary)' }} />
          <span>통합 Git Log 뷰어</span>
          {currentRepo && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--accent-cyan)',
                fontFamily: 'monospace',
              }}
            >
              {currentRepo.repoIdentifier}
            </span>
          )}
        </div>
      }
      maxWidth="min(1240px, 95vw)"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '520px' }}>
        {/* 상단 툴바: 저장소/브랜치 선택 및 검색 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* 저장소 선택기 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>저장소:</span>
              <select
                value={selectedRepoId || currentRepo?.id || ''}
                onChange={(e) => {
                  setSelectedRepoId(Number(e.target.value));
                  setSelectedBranch('');
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.repoIdentifier}
                  </option>
                ))}
              </select>
            </div>

            {/* 브랜치 표시 */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '11px',
                color: 'var(--text-sub)',
              }}
            >
              <GitBranch size={12} />
              <code>{activeBranch}</code>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 검색창 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                width: '220px',
              }}
            >
              <Search size={12} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="커밋 해시, 메시지..."
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-bright)',
                  fontSize: '11px',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              title="새로고침"
              style={{
                padding: '5px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-sub)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RefreshCw size={12} className={isRefetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 커밋 로그 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(80vh - 140px)', minHeight: '380px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', gap: '8px', color: 'var(--text-sub)' }}>
              <Loader2 size={18} className="animate-spin" />
              <span>Git 커밋 로그를 불러오는 중...</span>
            </div>
          ) : error ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--accent-rose)', fontSize: '13px' }}>
              커밋 로그를 불러오지 못했습니다. 저장소 및 토큰 상태를 확인해주세요.
            </div>
          ) : filteredCommits.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 16px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-sub)',
                gap: '8px',
              }}
            >
              <GitCommit size={28} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {searchTerm ? '검색된 커밋 로그가 없습니다.' : '조회된 커밋 로그가 없습니다.'}
              </div>
            </div>
          ) : (
            filteredCommits.map((c) => {
              const shortHash = (c.commitHash || '').slice(0, 7);

              return (
                <div
                  key={c.commitHash}
                  onClick={() => setSelectedCommit(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--accent-cyan)',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {shortHash}
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-bright)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.message}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-sub)' }}>
                        <span>{c.authorName}</span>
                        <span>•</span>
                        <span>{formatDate(c.committedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: 'var(--primary)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--bg-input)',
                      }}
                    >
                      <FileDiff size={12} />
                      <span>수정사항 확인</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 커밋 상세 Diff 모달 */}
      <GitCommitDetailModal
        isOpen={Boolean(selectedCommit)}
        onClose={() => setSelectedCommit(null)}
        repoMappingId={currentRepo?.id}
        commitHash={selectedCommit?.commitHash}
        repoIdentifier={currentRepo?.repoIdentifier}
      />
    </ModalWrapper>
  );
};
