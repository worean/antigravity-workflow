import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { Portal } from './Portal';

export interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: string;
  zIndex?: number;
  containerId?: string;
  children: React.ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  maxWidth = '600px',
  zIndex = 1000,
  containerId = 'ag-portal-root',
  children,
}) => {
  const overlayProps = useOverlayClickClose(onClose);

  // 1. ESC 키 입력 시 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 2. 모달 열림 시 배경(body) 스크롤 락 및 언마운트 시 복원
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal containerId={containerId}>
      <div
        className="modal-overlay"
        style={{ zIndex }}
        role="dialog"
        aria-modal="true"
        {...overlayProps}
      >
        <div
          className="modal-content"
          style={{ maxWidth }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div
              style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-main)',
              }}
            >
              {icon}
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-sub)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="닫기"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
    </Portal>
  );
};
