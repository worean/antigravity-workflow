import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe, Lock, Paperclip, Calendar, User, Edit3, Trash2, Download } from 'lucide-react';
import { useMemo, useMemoByTitle, useDeleteMemo } from '@/api/memo';
import { useAuth } from '@/context/AuthContext';
import { useUIStore } from '@/stores/useUIStore';
import { renderTextWithMemoMentions } from './MemoMentionLink';

interface MemoDetailModalProps {
  isOpen: boolean;
  target: number | string | null;
  onClose: () => void;
  onEdit?: (memoId: number) => void;
}

export const MemoDetailModal: React.FC<MemoDetailModalProps> = ({
  isOpen,
  target,
  onClose,
  onEdit,
}) => {
  const { user } = useAuth();
  const showToast = useUIStore((s) => s.showToast);
  const deleteMutation = useDeleteMemo();

  const isNumericId = typeof target === 'number';
  const memoId = isNumericId ? target : null;
  const memoTitle = typeof target === 'string' ? target : null;

  const { data: memoById, isLoading: isLoadingId, error: errorId } = useMemo(memoId, {
    enabled: isOpen && isNumericId,
  });

  const { data: memoByTitle, isLoading: isLoadingTitle, error: errorTitle } = useMemoByTitle(
    memoTitle,
    { enabled: isOpen && !isNumericId }
  );

  const memo = isNumericId ? memoById : memoByTitle;
  const isLoading = isNumericId ? isLoadingId : isLoadingTitle;
  const error = isNumericId ? errorId : errorTitle;

  // ESC 키 닫기 및 스크롤 락
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !target) return null;

  const isAuthor = user?.id && memo?.authorId === user.id;

  const handleDelete = async () => {
    if (!memo) return;
    if (!window.confirm('정말 이 메모를 삭제하시겠습니까?')) return;

    try {
      await deleteMutation.mutateAsync(memo.id);
      showToast('메모가 삭제되었습니다.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || '메모 삭제에 실패했습니다.', 'error');
    }
  };

  const modalRoot = document.getElementById('ag-portal-root') || document.body;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="memo-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '680px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-light)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {memo && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: memo.isPublic ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: memo.isPublic ? 'var(--status-done, #22c55e)' : 'var(--status-todo, #eab308)',
                }}
              >
                {memo.isPublic ? <Globe size={13} /> : <Lock size={13} />}
                {memo.isPublic ? '공개 메모' : '비공개 메모'}
              </span>
            )}
            <h2
              id="memo-detail-title"
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-bright)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {memo?.title || (typeof target === 'string' ? `@${target}` : '메모 조회')}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAuthor && memo && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onEdit) onEdit(memo.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={14} />
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--status-urgent, #ef4444)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 본문 콘텐츠 */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: '180px' }}>
          {isLoading && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              메모 정보를 불러오는 중입니다...
            </div>
          )}

          {error && !isLoading && (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                color: 'var(--status-urgent, #ef4444)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '8px',
              }}
            >
              <Lock size={32} style={{ marginBottom: '8px', opacity: 0.8 }} />
              <div style={{ fontWeight: 600 }}>메모를 조회할 수 없습니다.</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                {(error as any)?.response?.data?.error || (error as any)?.message || '비공개 메모이거나 삭제되었습니다.'}
              </div>
            </div>
          )}

          {memo && !isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 메타 정보 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '12px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} />
                  {memo.author?.name || memo.author?.email || '작성자'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} />
                  {new Date(memo.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* 마크다운 본문 (멘션 감지 적용) */}
              <div
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  minHeight: '80px',
                }}
              >
                {renderTextWithMemoMentions(memo.content)}
              </div>

              {/* 첨부파일 섹션 */}
              {memo.attachments && memo.attachments.length > 0 && (
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-bright)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Paperclip size={14} />
                    첨부파일 ({memo.attachments.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {memo.attachments.map((att) => (
                      <div
                        key={att.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Paperclip size={14} color="var(--primary)" />
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                            {att.fileName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({(att.fileSize / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </span>
                        <a
                          href={att.fileUrl}
                          download={att.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--primary)',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                          }}
                        >
                          <Download size={12} />
                          다운로드
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
};
