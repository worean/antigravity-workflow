import React from 'react';
import { Paperclip, X } from 'lucide-react';
import type { ChatAttachment } from '@/types';
import { formatFileSize, isImageFile } from '@/utils/fileUtils';

export interface ChatAttachmentInputPreviewProps {
  attachments: ChatAttachment[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export const ChatAttachmentInputPreview: React.FC<ChatAttachmentInputPreviewProps> = ({
  attachments,
  onRemove,
  disabled = false,
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '8px',
        padding: '6px 8px',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-light)',
        borderRadius: '6px',
        maxHeight: '130px',
        overflowY: 'auto',
      }}
    >
      {attachments.map((att, idx) => {
        const isImg = isImageFile(att.fileType || att.fileName);
        return (
          <div
            key={`${att.fileName}-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: 'var(--text-main)',
              maxWidth: '220px',
            }}
          >
            {isImg && att.fileUrl ? (
              <img
                src={att.fileUrl}
                alt={att.fileName}
                style={{
                  width: '24px',
                  height: '24px',
                  objectFit: 'cover',
                  borderRadius: '3px',
                  border: '1px solid var(--border-light)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <Paperclip size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'var(--text-bright)',
                  fontWeight: 500,
                }}
                title={att.fileName}
              >
                {att.fileName}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {formatFileSize(att.fileSize)}
              </span>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '3px',
                  marginLeft: '2px',
                  flexShrink: 0,
                }}
                title="첨부 취소"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--status-urgent, #ef4444)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
