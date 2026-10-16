import React from 'react';
import { X } from 'lucide-react';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { useModalLayer } from '@/hooks/useModalLayer';
import { Portal } from './Portal';

export interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: string;
  zIndex?: number;
  isConfirm?: boolean;
  containerId?: string;
  targetElement?: HTMLElement | null;
  triggerKey?: unknown;
  children: React.ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  id: customId,
  title,
  icon,
  maxWidth = '600px',
  zIndex,
  isConfirm = false,
  containerId = 'ag-portal-root',
  targetElement,
  triggerKey,
  children,
}) => {
  const overlayProps = useOverlayClickClose(onClose);
  const { effectiveZIndex } = useModalLayer(isOpen, {
    id: customId,
    baseZIndex: zIndex,
    isConfirm,
    onClose,
    triggerKey,
  });

  if (!isOpen) return null;

  return (
    <Portal containerId={containerId} targetElement={targetElement}>
      <div
        className="modal-overlay"
        style={{ zIndex: effectiveZIndex }}
        role="dialog"
        aria-modal="true"
        {...overlayProps}
      >
        <div
          className="modal-content"
          style={{ maxWidth }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
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
