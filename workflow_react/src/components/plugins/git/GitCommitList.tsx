import React, { useState } from 'react';
import { GitCommit, Copy, Check, Loader2, Trash2, Plus, FileDiff } from 'lucide-react';
import type { GitCommitItem } from '@/api/gitPlugin';
import { GitCommitDetailModal } from './GitCommitDetailModal';

interface GitCommitListProps {
  commits: GitCommitItem[];
  isLoading?: boolean;
  onOpenCommitPicker?: () => void;
  onUnlinkCommit?: (commitLinkId: number) => Promise<void>;
  defaultRepoMappingId?: number;
  repoIdentifier?: string;
}

export const GitCommitList: React.FC<GitCommitListProps> = ({
  commits,
  isLoading,
  onOpenCommitPicker,
  onUnlinkCommit,
  defaultRepoMappingId,
  repoIdentifier,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<GitCommitItem | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null);

  const handleCopy = (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => {
      setCopiedHash(null);
    }, 2000);
  };

  const handleUnlink = async (e: React.MouseEvent, commitLinkId: number) => {
    e.stopPropagation();
    if (!onUnlinkCommit) return;
    if (confirm('이 커밋 연결을 해제하시겠습니까?')) {
      setUnlinkingId(commitLinkId);
      try {
        await onUnlinkCommit(commitLinkId);
      } finally {
        setUnlinkingId(null);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '8px', color: 'var(--text-sub)' }}>
        <Loader2 size={18} className="animate-spin" />
        <span>커밋 내역을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 상단 액션 바: 커밋 수동 연결 버튼 */}
      {onOpenCommitPicker && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onOpenCommitPicker}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} style={{ color: 'var(--primary)' }} />
            <span>커밋 수동 등록 및 연결</span>
          </button>
        </div>
      )}

      {/* 커밋 목록 */}
      {!commits || commits.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-light)',
            color: 'var(--text-sub)',
            textAlign: 'center',
            gap: '8px',
          }}
        >
          <GitCommit size={28} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>연결된 커밋 내역이 없습니다</div>
          <div style={{ fontSize: '13px' }}>
            커밋 메시지에 일감 번호(예: <code>#123</code>)를 포함하여 푸시하거나 상단의 <b>[커밋 수동 등록 및 연결]</b> 버튼으로 직접 연결할 수 있습니다.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {commits.map((c) => {
            const shortHash = c.commitHash.slice(0, 7);
            const isCopied = copiedHash === c.commitHash;

            return (
              <div
                key={c.id || c.commitHash}
                onClick={() => setSelectedCommit(c)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                }}
              >
                {/* 단축 해시 복사 버튼 */}
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, c.commitHash)}
                  title={`클릭 시 해시 복사: ${c.commitHash}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 6px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--accent-cyan)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <GitCommit size={12} />
                  <span>{shortHash}</span>
                  {isCopied ? <Check size={11} style={{ color: 'var(--secondary)' }} /> : <Copy size={11} />}
                </button>

                {/* 메시지 및 작성자 정보 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: 'var(--text-bright)',
                      fontSize: '13px',
                      fontWeight: 600,
                      wordBreak: 'break-word',
                      lineHeight: '1.4',
                    }}
                  >
                    {c.message}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-sub)', flexWrap: 'wrap' }}>
                    {c.repoIdentifier && (
                      <span
                        style={{
                          padding: '1px 5px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {c.repoIdentifier}
                      </span>
                    )}
                    <span>{c.authorName}</span>
                    {c.authorEmail && <span>&lt;{c.authorEmail}&gt;</span>}
                    <span>•</span>
                    <span>{formatDate(c.committedAt)}</span>
                    <span style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}>
                      <FileDiff size={12} /> Diff 보기
                    </span>
                  </div>
                </div>

                {/* 연결 해제 액션 */}
                {onUnlinkCommit && c.id && (
                  <button
                    type="button"
                    onClick={(e) => handleUnlink(e, c.id!)}
                    disabled={unlinkingId === c.id}
                    title="이슈에서 커밋 연결 해제"
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {unlinkingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 커밋 상세 Diff 팝업 모달 */}
      <GitCommitDetailModal
        isOpen={Boolean(selectedCommit)}
        onClose={() => setSelectedCommit(null)}
        repoMappingId={selectedCommit?.repoMappingId || defaultRepoMappingId}
        commitHash={selectedCommit?.commitHash}
        repoIdentifier={selectedCommit?.repoIdentifier || repoIdentifier}
      />
    </div>
  );
};
