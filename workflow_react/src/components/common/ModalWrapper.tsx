import React, { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { modalRegistry, MODAL_Z_INDEX } from '@/utils/modalUtils';
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
  children,
}) => {
  const autoId = useId();
  const modalId = customId || autoId;
  const overlayProps = useOverlayClickClose(onClose);
  const [effectiveZIndex, setEffectiveZIndex] = useState<number>(
    zIndex ?? (isConfirm ? MODAL_Z_INDEX.CONFIRM_ALERT_BASE : MODAL_Z_INDEX.MODAL_BASE)
  );

  // 1. 모달 스택 레지스트리 등록 및 동적 계층 z-index 할당
  useEffect(() => {
    if (!isOpen) return;

    const calculatedZ = modalRegistry.register(modalId, {
      baseZIndex: zIndex,
      isConfirm,
    });
    setEffectiveZIndex(calculatedZ);

    return () => {
      modalRegistry.unregister(modalId);
    };
  }, [isOpen, modalId, zIndex, isConfirm]);

  // 2. 최상위(Top) 모달인 경우에만 ESC 키 입력 시 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const topId = modalRegistry.getTopModalId();
        if (topId === modalId || !topId) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, modalId, onClose]);

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
