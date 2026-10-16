import React from 'react';
import { AlertOctagon, X } from 'lucide-react';
import type { ErrorModalState } from '@/hooks/useActionFeedback';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { useModalLayer } from '@/hooks/useModalLayer';
import { Portal } from '@/components/common/Portal';

interface ActionFeedbackModalProps {
  state?: ErrorModalState | null;
  onClose: () => void;
}

export const ActionFeedbackModal: React.FC<ActionFeedbackModalProps> = ({ state, onClose }) => {
  const isOpen = Boolean(state && state.isOpen);
  const overlayProps = useOverlayClickClose(onClose);
  const { effectiveZIndex } = useModalLayer(isOpen, {
    isConfirm: true,
    onClose,
  });

  if (!isOpen || !state) return null;

  return (
    <Portal containerId="ag-portal-root">
      <div className="modal-overlay" style={{ zIndex: effectiveZIndex }} {...overlayProps}>
        <div
          className="modal-content"
          style={{
            maxWidth: '420px',
            padding: '28px 24px',
            textAlign: 'center',
            background: 'var(--bg-modal)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 20px 40px rgba(244, 63, 94, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', margin: '-10px -10px 0 0' }}>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)',
              }}
            >
              <AlertOctagon size={36} />
            </div>

            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: 'rgba(244, 63, 94, 0.2)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  marginBottom: '8px',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                }}
              >
                ErrorCode: {state.errorCode || 'ERR_UNKNOWN'} {state.statusCode ? `(${state.statusCode})` : ''}
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                요청 처리 실패 (Fail)
              </h3>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {state.message || '서버 요청 처리 중 오류가 발생했습니다.'}
              </p>
            </div>

            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{
                width: '100%',
                marginTop: '8px',
                background: 'var(--accent-rose)',
                color: 'var(--text-on-primary)',
                fontWeight: 700,
                border: 'none',
              }}
            >
              확인 및 닫기
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

