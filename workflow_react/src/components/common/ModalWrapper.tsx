import React from 'react';
import { X } from 'lucide-react';
import { useOverlayClickClose } from '../../hooks/useOverlayClickClose';

export interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: string;
  zIndex?: number;
  children: React.ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  maxWidth = '600px',
  zIndex = 1000,
  children,
}) => {
  const overlayProps = useOverlayClickClose(onClose);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex }} {...overlayProps}>
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
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
