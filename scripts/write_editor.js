const fs = require('fs');

const code = `import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe, Lock, Paperclip, Save, Trash2, AlertCircle } from 'lucide-react';
import { useMemo, useCreateMemo, useUpdateMemo, useUploadMemoAttachment, useDeleteMemoAttachment } from '@/api/memo';
import { useUIStore } from '@/stores/useUIStore';

export interface MemoEditorModalProps {
  isOpen: boolean;
  memoId: number | null;
  onClose: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const MemoEditorModal: React.FC<MemoEditorModalProps> = ({
  isOpen,
  memoId,
  onClose,
}) => {
  const showToast = useUIStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existingMemo, isLoading } = useMemo(memoId, {
    enabled: isOpen && !!memoId,
  });

  const createMutation = useCreateMemo();
  const updateMutation = useUpdateMemo();
  const uploadAttachmentMutation = useUploadMemoAttachment();
  const deleteAttachmentMutation = useDeleteMemoAttachment();

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

  // ESC 닫기 및 스크롤 락
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const errMsg = \`첨부파일 크기는 최대 5MB를 초과할 수 없습니다. (선택한 파일: \${sizeMb}MB)\`;
      setErrorMessage(errMsg);
      showToast(errMsg, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMessage(null);

    if (memoId) {
      try {
        const dummyUrl = \`/uploads/memos/\${memoId}/\${encodeURIComponent(file.name)}\`;
        await uploadAttachmentMutation.mutateAsync({
          memoId,
          data: {
            fileName: file.name,
            fileSize: file.size,
            fileUrl: dummyUrl,
            fileType: file.type || 'application/octet-stream',
          },
        });
        showToast('첨부파일이 등록되었습니다.', 'success');
      } catch (err: any) {
        showToast(err.message || '첨부파일 등록에 실패했습니다.', 'error');
      }
    } else {
      showToast('신규 메모는 저장 후 첨부파일을 등록할 수 있습니다.', 'info');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
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
  const modalRoot = document.getElementById('ag-portal-root') || document.body;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="memo-editor-title"
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
                  color: 'var(--status-urgent, #ef4444)',
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
                메모 제목 <span style={{ color: 'var(--status-urgent, #ef4444)' }}>*</span>
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
                    border: isPublic ? '2px solid var(--status-done, #22c55e)' : '1px solid var(--border-light)',
                    backgroundColor: isPublic ? 'var(--bg-subtle)' : 'var(--bg-card)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  <Globe size={16} color={isPublic ? 'var(--status-done, #22c55e)' : 'var(--text-muted)'} />
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
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="마크다운 문법으로 내용을 작성하세요. (예: # 헤더, - 목록, @참조메모)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                  첨부파일 (파일당 최대 5MB)
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  <Paperclip size={13} />
                  파일 추가
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {existingMemo?.attachments && existingMemo.attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {existingMemo.attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Paperclip size={13} color="var(--primary)" />
                        <span style={{ color: 'var(--text-main)' }}>{att.fileName}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ({(att.fileSize / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--status-urgent, #ef4444)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="첨부파일 삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
    </div>,
    modalRoot
  );
};
`;

fs.writeFileSync('workflow_react/src/components/memos/MemoEditorModal.tsx', '\\ufeff' + code.trim() + '\\n', 'utf8');
console.log('MemoEditorModal successfully written with BOM');
