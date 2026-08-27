import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ModalWrapper, Button } from './common';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '삭제',
  cancelText = '취소',
  onConfirm,
  onClose,
  loading = false,
}) => {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="380px"
      title={title}
      icon={
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(241, 76, 76, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f14c4c',
          }}
        >
          <AlertTriangle size={14} />
        </div>
      }
    >
      <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '14px', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
        {message}
      </p>

      <div style={{ display: 'flex', gap: '6px' }}>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading} style={{ flex: 1 }}>
          {cancelText}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onConfirm}
          isLoading={loading}
          style={{ flex: 1 }}
        >
          {confirmText}
        </Button>
      </div>
    </ModalWrapper>
  );
};
