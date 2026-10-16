import React, { useState, useEffect } from 'react';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { useModalLayer } from '@/hooks/useModalLayer';
import { Portal } from '@/components/common/Portal';
import { X, Globe, Lock, Save, AlertCircle } from 'lucide-react';
import { useMemo, useCreateMemo, useUpdateMemo, useUploadMemoAttachment, useDeleteMemoAttachment } from '@/api/memo';
import { useUIStore } from '@/stores/useUIStore';
import { MemoAttachmentSection } from './MemoAttachmentSection';
import { MemoMarkdownEditor } from './MemoMarkdownEditor';

export interface MemoEditorModalProps {
  isOpen: boolean;
  memoId: number | null;
  onClose: () => void;
}

export const MemoEditorModal: React.FC<MemoEditorModalProps> = ({
  isOpen,
  memoId,
  onClose,
}) => {
  const showToast = useUIStore((s) => s.showToast);
  const { zIndex: dynamicZIndex } = useModalLayer(isOpen, {
    onClose,
    triggerKey: memoId,
  });

  const { data: existingMemo, isLoading } = useMemo(memoId, {
    enabled: isOpen && !!memoId,
  });

  const createMutation = useCreateMemo();
  const updateMutation = useUpdateMemo();
  const uploadAttachmentMutation = useUploadMemoAttachment();
  const deleteAttachmentMutation = useDeleteMemoAttachment();
  const overlayProps = useOverlayClickClose(onClose);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (existingMemo && memoId) {
      setTitle(existingMemo.title || '');
      setContent(existingMemo.content || '');
      setIsPublic(Boolean(existingMemo.isPublic));
      setErrorMessage(null);
    } else if (!memoId) {
      setTitle('');
      setContent('');
      setIsPublic(false);
      setErrorMessage(null);
    }
  }, [existingMemo, memoId, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('메모 제목을 입력해 주세요.');
      return;
    }

    try {
      if (memoId) {
        await updateMutation.mutateAsync({
          id: memoId,
          data: { title: title.trim(), content, isPublic },
        });
        showToast('메모가 성공적으로 수정되었습니다.', 'success');
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          content,
          isPublic,
          workspaceId: 1,
        });
        showToast('새 메모가 등록되었습니다.', 'success');
      }
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || '저장에 실패했습니다.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleUploadAttachment = async (file: File) => {
    if (!memoId) return;
    try {
      showToast('첨부파일 업로드 중...', 'info');
      const dataUrl = await readFileAsDataUrl(file);
      await uploadAttachmentMutation.mutateAsync({
        memoId,
        data: {
          fileName: file.name,
          fileSize: file.size,
          fileUrl: dataUrl,
          fileType: file.type || 'application/octet-stream',
        },
      });
      showToast('첨부파일이 등록되었습니다.', 'success');
    } catch (err: any) {
      showToast(err.message || '첨부파일 등록 실패', 'error');
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!memoId) return;
    if (!window.confirm('첨부파일을 삭제하시겠습니까?')) return;
    try {
      await deleteAttachmentMutation.mutateAsync({ memoId, attachmentId });
      showToast('첨부파일이 삭제되었습니다.', 'success');
    } catch (err: any) {
      showToast(err.message || '첨부파일 삭제 실패', 'error');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-editor-title"
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
            <h2
              id="memo-editor-title"
              style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)' }}
            >
              {memoId ? '메모 수정' : '새 메모 작성'}
            </h2>
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
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 폼 본문 */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '6px',
                    color: 'var(--status-urgent)',
                    fontSize: '0.85rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}
                >
                  메모 제목 <span style={{ color: 'var(--status-urgent)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="메모 제목을 입력하세요 (예: 2026 인프라 아키텍처)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                  disabled={isLoading}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  💡 본문이나 이슈 등에서 <code>@{'{제목}'}</code>으로 링크할 수 있습니다.
                </span>
              </div>

              <div>
                <label
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '8px' }}
                >
                  공개 범위
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: !isPublic ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      backgroundColor: !isPublic ? 'var(--bg-subtle)' : 'var(--bg-card)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Lock size={16} color={!isPublic ? 'var(--primary)' : 'var(--text-muted)'} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>비공개 메모</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>본인만 열람/수정 가능</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: isPublic ? '2px solid var(--status-done)' : '1px solid var(--border-light)',
                      backgroundColor: isPublic ? 'var(--bg-subtle)' : 'var(--bg-card)',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Globe size={16} color={isPublic ? 'var(--status-done)' : 'var(--text-muted)'} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>워크스페이스 공개</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>워크스페이스 모든 구성원 열람 가능</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '6px' }}
                >
                  메모 내용 (Markdown 지원)
                </label>
                <MemoMarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="마크다운 문법으로 작성하세요. (예: # 헤더, - 목록, @참조메모)"
                  rows={9}
                  disabled={isLoading}
                />
              </div>

              <MemoAttachmentSection
                memoId={memoId}
                attachments={existingMemo?.attachments}
                onUpload={handleUploadAttachment}
                onDelete={handleDeleteAttachment}
              />
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                backgroundColor: 'var(--bg-subtle)',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--text-bright)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <Save size={15} />
                {isSubmitting ? '저장 중...' : memoId ? '수정 완료' : '메모 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};