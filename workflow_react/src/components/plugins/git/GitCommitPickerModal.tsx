import React, { useState } from 'react';
import { GitCommit, Search, Check, Loader2 } from 'lucide-react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import { useRepoCommits, type GitCommitItem } from '@/api/gitPlugin';

interface GitCommitPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  availableRepositories?: Array<{
    id: number;
    repoIdentifier: string;
    defaultBranch?: string;
  }>;
  onSelectCommit: (commit: {
    repoMappingId: number;
    commitHash: string;
    message: string;
    authorName: string;
    authorEmail?: string;
    committedAt?: string;
  }) => Promise<void>;
}

export const GitCommitPickerModal: React.FC<GitCommitPickerModalProps> = ({
  isOpen,
  onClose,
  title = 'Git 커밋 선택 및 연결',
  availableRepositories = [],
  onSelectCommit,
}) => {
  const [mode, setMode] = useState<'remote' | 'manual'>('remote');
  const [selectedRepoId, setSelectedRepoId] = useState<number>(availableRepositories[0]?.id || 0);
  const [branch, setBranch] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수동 입력 상태
  const [manualHash, setManualHash] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');

  const currentRepo = availableRepositories.find((r) => r.id === selectedRepoId) || availableRepositories[0];

  const { data: repoCommitsData, isLoading: isCommitsLoading } = useRepoCommits(
    selectedRepoId || currentRepo?.id,
    branch || currentRepo?.defaultBranch || 'main',
    1,
    40,
    isOpen && mode === 'remote' && Boolean(selectedRepoId || currentRepo?.id)
  );

  const commits = repoCommitsData?.commits || [];

  const filteredCommits = commits.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.commitHash.toLowerCase().includes(term) ||
      c.message.toLowerCase().includes(term) ||
      c.authorName.toLowerCase().includes(term)
    );
  });

  const handleSelectRemoteCommit = async (c: GitCommitItem) => {
    if (!currentRepo) return;
    setIsSubmitting(true);
    try {
      await onSelectCommit({
        repoMappingId: currentRepo.id,
        commitHash: c.commitHash,
        message: c.message,
        authorName: c.authorName,
        authorEmail: c.authorEmail || undefined,
        committedAt: c.committedAt,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || '커밋 연결에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRepo) return;
    if (!manualHash.trim()) return alert('커밋 해시(SHA)를 입력해주세요.');
    if (!manualMessage.trim()) return alert('커밋 메시지를 입력해주세요.');

    setIsSubmitting(true);
    try {
      await onSelectCommit({
        repoMappingId: currentRepo.id,
        commitHash: manualHash.trim(),
        message: manualMessage.trim(),
        authorName: manualAuthor.trim() || 'Git User',
        committedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || '커밋 연결에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCommit size={18} style={{ color: 'var(--primary)' }} />
          <span>{title}</span>
        </div>
      }
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '380px' }}>
        {/* 상단 저장소 선택 및 탭 전환 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          {/* 저장소 선택 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>저장소:</span>
            <select
              value={selectedRepoId || currentRepo?.id || ''}
              onChange={(e) => {
                setSelectedRepoId(Number(e.target.value));
                setBranch('');
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
              {availableRepositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.repoIdentifier} ({r.defaultBranch || 'main'})
                </option>
              ))}
            </select>
          </div>

          {/* 모드 선택: 원격 커밋 목록 vs 수동 해시 입력 */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-xs)' }}>
            <button
              type="button"
              onClick={() => setMode('remote')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: mode === 'remote' ? 600 : 400,
                backgroundColor: mode === 'remote' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'remote' ? 'var(--text-bright)' : 'var(--text-sub)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              원격 커밋 탐색
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: mode === 'manual' ? 600 : 400,
                backgroundColor: mode === 'manual' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'manual' ? 'var(--text-bright)' : 'var(--text-sub)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              커밋 해시 직접 입력
            </button>
          </div>
        </div>

        {/* 탭 1: 원격 커밋 목록에서 선택 */}
        {mode === 'remote' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="커밋 해시, 메시지, 작성자 검색..."
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
              {isCommitsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', gap: '8px', color: 'var(--text-sub)' }}>
                  <Loader2 size={18} className="animate-spin" />
                  <span>커밋 목록을 불러오는 중...</span>
                </div>
              ) : filteredCommits.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {searchTerm ? '검색된 커밋이 없습니다.' : '조회된 커밋이 없습니다.'}
                </div>
              ) : (
                filteredCommits.map((c) => (
                  <div
                    key={c.commitHash}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {(c.commitHash || '').slice(0, 7)}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.message}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                        {c.authorName} • {c.committedAt ? c.committedAt.slice(0, 16).replace('T', ' ') : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSelectRemoteCommit(c)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        backgroundColor: 'var(--primary)',
                        color: 'var(--text-on-primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={11} />
                      <span>연결</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 탭 2: 커밋 해시 직접 입력 */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>커밋 해시 (SHA) *</label>
              <input
                type="text"
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value)}
                placeholder="예: 7a8b9c0d1e2f3... (전체 또는 7자 이상 SHA)"
                style={{
                  padding: '7px 10px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>커밋 메시지 *</label>
              <input
                type="text"
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                placeholder="예: feat: add new feature"
                style={{
                  padding: '7px 10px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>작성자 이름</label>
              <input
                type="text"
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
                placeholder="예: 홍길동 (입력하지 않으면 Git User로 등록)"
                style={{
                  padding: '7px 10px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-sub)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-on-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? '연결 중...' : '커밋 연결'}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
};
