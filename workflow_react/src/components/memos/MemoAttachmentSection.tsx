import React, { useRef } from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
import type { MemoAttachmentDto } from '@/types/memo';
import { useUIStore } from '@/stores/useUIStore';

export interface MemoAttachmentSectionProps {
  memoId: number | null;
  attachments?: MemoAttachmentDto[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: number) => Promise<void>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const MemoAttachmentSection: React.FC<MemoAttachmentSectionProps> = ({
  memoId,
  attachments = [],
  onUpload,
  onDelete,
}) => {
  const showToast = useUIStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const errMsg = `첨부파일 크기는 최대 5MB를 초과할 수 없습니다. (선택한 파일: ${sizeMb}MB)`;
      showToast(errMsg, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (memoId) {
      await onUpload(file);
    } else {
      showToast('신규 메모는 저장 후 첨부파일을 등록할 수 있습니다.', 'info');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
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

      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          {attachments.map((att) => (
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
                onClick={() => onDelete(att.id)}
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
  );
};
