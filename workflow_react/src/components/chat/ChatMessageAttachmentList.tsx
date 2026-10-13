import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Paperclip, Download, X } from 'lucide-react';
import type { ChatAttachment } from '@/types';

export interface ChatMessageAttachmentListProps {
  attachments: ChatAttachment[] | string | any[] | null | undefined;
}

const parseAttachments = (raw: any): ChatAttachment[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isImageAttachment = (fileName?: string, fileType?: string | null): boolean => {
  if (fileType?.startsWith('image/')) return true;
  if (!fileName) return false;
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fileName);
};

const triggerDownload = (fileName: string, fileUrl: string, fileType?: string | null) => {
  if (!fileUrl) return;

  if (fileUrl.startsWith('data:')) {
    try {
      const commaIdx = fileUrl.indexOf(',');
      const metaPart = fileUrl.substring(0, commaIdx);
      const base64Data = fileUrl.substring(commaIdx + 1);

      const mimeMatch = metaPart.match(/data:([^;]+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : (fileType || 'application/octet-stream');

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const blob = new Blob([byteNumbers], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return;
    } catch (err) {
      console.error('Data URL direct decode failed:', err);
    }
  }

  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName || 'download';
  link.target = '_blank';
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const ChatMessageAttachmentList: React.FC<ChatMessageAttachmentListProps> = ({ attachments }) => {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const list = parseAttachments(attachments);

  if (list.length === 0) return null;

  const modalRoot = (typeof document !== 'undefined' && document.getElementById('ag-portal-root')) || (typeof document !== 'undefined' ? document.body : null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
      {/* Attachments Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {list.map((att, idx) => {
          const fileName = att.fileName || (att as any).filename || '첨부파일';
          const fileUrl = att.fileUrl || (att as any).url || '';
          const isImg = isImageAttachment(fileName, att.fileType);

          if (isImg && fileUrl) {
            return (
              <div
                key={`${fileName}-${idx}`}
                style={{
                  position: 'relative',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  maxWidth: '240px',
                  maxHeight: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setPreviewImage({ url: fileUrl, name: fileName })}
                title="클릭하여 원본 보기"
              >
                <img
                  src={fileUrl}
                  alt={fileName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '180px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    padding: '3px 6px',
                    fontSize: '0.68rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '150px',
                    }}
                  >
                    {fileName}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerDownload(fileName, fileUrl, att.fileType);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                    title="다운로드"
                  >
                    <Download size={12} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={`${fileName}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '0.78rem',
                maxWidth: '280px',
              }}
            >
              <Paperclip size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    color: 'var(--text-bright)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={fileName}
                >
                  {fileName}
                </span>
                {att.fileSize ? (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {formatFileSize(att.fileSize)}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(fileName, fileUrl, att.fileType)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
                title="다운로드"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Download size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Image Preview Lightbox Modal */}
      {previewImage && modalRoot && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderBottom: '1px solid var(--border-light)',
                background: 'var(--bg-subtle)',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-bright)',
                  maxWidth: '300px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {previewImage.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => triggerDownload(previewImage.name, previewImage.url)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                  }}
                  title="다운로드"
                >
                  <Download size={14} />
                  다운로드
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="닫기"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                padding: '12px',
                maxHeight: 'calc(90vh - 60px)',
              }}
            >
              <img
                src={previewImage.url}
                alt={previewImage.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 84px)',
                  objectFit: 'contain',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        </div>,
        modalRoot
      )}
    </div>
  );
};
