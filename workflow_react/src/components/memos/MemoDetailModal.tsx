import React, { useState } from 'react';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { useModalLayer } from '@/hooks/useModalLayer';
import { Portal } from '@/components/common/Portal';
import { X, Globe, Lock, Paperclip, Calendar, User, Edit3, Trash2, Download } from 'lucide-react';
import { useMemo, useMemoByTitle, useDeleteMemo } from '@/api/memo';
import { useAuth } from '@/context/AuthContext';
import { useUIStore } from '@/stores/useUIStore';
import { MemoMarkdownRenderer } from './MemoMarkdownRenderer';

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
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const isVisible = isOpen && Boolean(target);
  const { zIndex: dynamicZIndex } = useModalLayer(isVisible, {
    onClose: () => (previewImage ? setPreviewImage(null) : onClose()),
    triggerKey: target,
  });
  const overlayProps = useOverlayClickClose(onClose);

  const isNumericId = typeof target === 'number';
  const memoId = isNumericId ? target : null;
  const memoTitle = typeof target === 'string' ? target : null;

  const { data: memoById, isLoading: isLoadingId, error: errorId } = useMemo(memoId, {
    enabled: isVisible && isNumericId,
  });
  const { data: memoByTitle, isLoading: isLoadingTitle, error: errorTitle } = useMemoByTitle(
    memoTitle,
    { enabled: isVisible && !isNumericId }
  );

  const memo = isNumericId ? memoById : memoByTitle;
  const isLoading = isNumericId ? isLoadingId : isLoadingTitle;
  const error = isNumericId ? errorId : errorTitle;

  if (!isVisible) return null;

  const isAuthor = user?.id && memo?.authorId === user.id;
  const isImageAttachment = (fileName: string, fileType?: string | null) =>
    Boolean(fileType?.startsWith('image/')) || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fileName);

  const handleDownloadAttachment = (att: { id: number; fileName: string; fileUrl: string; fileType?: string | null }) => {
    if (att.fileUrl && att.fileUrl.startsWith('data:')) {
      try {
        const commaIdx = att.fileUrl.indexOf(',');
        const metaPart = att.fileUrl.substring(0, commaIdx);
        const base64Data = att.fileUrl.substring(commaIdx + 1);
        const mimeMatch = metaPart.match(/data:([^;]+);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : (att.fileType || 'application/octet-stream');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blobUrl = URL.createObjectURL(new Blob([byteNumbers], { type: mimeType }));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = att.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      } catch (err) {
        console.error('Data URL direct decode failed:', err);
      }
    }
    if (memo) {
      window.open(`/api/memos/${memo.id}/attachments/${att.id}/download`, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!memo || !window.confirm('정말 이 메모를 삭제하시겠습니까?')) return;
    try {
      await deleteMutation.mutateAsync(memo.id);
      showToast('메모가 삭제되었습니다.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || '메모 삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-detail-title"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: dynamicZIndex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(3px)',
        }}
        {...overlayProps}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
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
                    color: memo.isPublic ? 'var(--status-done)' : 'var(--status-todo)',
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
                    onClick={() => onEdit && onEdit(memo.id)}
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
                    <Edit3 size={14} /> 수정
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
                      color: 'var(--status-urgent)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> 삭제
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
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
                  color: 'var(--status-urgent)',
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
                    <User size={14} /> {memo.author?.name || memo.author?.email || '작성자'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> {new Date(memo.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ minHeight: '80px', padding: '4px 0' }}>
                  <MemoMarkdownRenderer content={memo.content} />
                </div>

                {memo.attachments && memo.attachments.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Paperclip size={14} /> 첨부파일 ({memo.attachments.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {memo.attachments.map((att) => {
                        const isImg = isImageAttachment(att.fileName, att.fileType);
                        return (
                          <div
                            key={att.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              backgroundColor: 'var(--bg-subtle)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              {isImg && att.fileUrl ? (
                                <img
                                  src={att.fileUrl}
                                  alt={att.fileName}
                                  onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                  style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-light)' }}
                                  title="클릭하여 원본 사진 미리보기"
                                />
                              ) : (
                                <Paperclip size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <span style={{ fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={att.fileName}>
                                  {att.fileName}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {(att.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              {isImg && att.fileUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                  style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  미리보기
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(att)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}
                              >
                                <Download size={12} /> 다운로드
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {previewImage && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
            style={{ position: 'fixed', inset: 0, zIndex: dynamicZIndex + 5, backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '90vw', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-bright)', fontSize: '0.9rem', fontWeight: 600 }}>{previewImage.name}</span>
              <button type="button" onClick={() => setPreviewImage(null)} style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'var(--text-bright)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                닫기 (ESC)
              </button>
            </div>
            <img src={previewImage.url} alt={previewImage.name} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }} />
          </div>
        )}
      </div>
    </Portal>
  );
};
