import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { Portal } from './Portal';

/**
 * 🍞 GlobalToast - 전역 실시간 피드백 토스트 알림
 * 
 * Zustand(useUIStore) 상태를 구독하여,
 * - 긍정응답(success): 다크 에메랄드/그린 배경, 초록 테두리 및 체크 아이콘
 * - 부정응답(error): 다크 크림슨/레드 배경, 빨간 테두리 및 경고 아이콘
 * - 3초 자동 소멸 및 신규 알림 시 3초 타이머 즉시 갱신
 * - 최상위 Portal(#ag-portal-root)을 통한 안전한 오버레이 렌더링
 */
export const GlobalToast: React.FC = () => {
  const toast = useUIStore((s) => s.toast);
  const hideToast = useUIStore((s) => s.hideToast);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  // 다크 모던 테크 스타일에 맞춘 색상 구성
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 999999,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    minWidth: '280px',
    maxWidth: '460px',
    borderRadius: '8px',
    boxShadow: isError
      ? '0 12px 32px rgba(239, 68, 68, 0.25), 0 4px 12px rgba(0, 0, 0, 0.6)'
      : '0 12px 32px rgba(16, 185, 129, 0.25), 0 4px 12px rgba(0, 0, 0, 0.6)',
    background: isError
      ? 'rgba(35, 10, 15, 0.96)'
      : 'rgba(6, 35, 25, 0.96)',
    border: isError
      ? '1px solid rgba(239, 68, 68, 0.65)'
      : '1px solid rgba(16, 185, 129, 0.65)',
    color: isError ? '#fef2f2' : '#ecfdf5',
    fontSize: '0.88rem',
    backdropFilter: 'blur(12px)',
    animation: 'fadeInUp 0.22s ease-out',
  };

  return (
    <Portal>
      <div role="status" aria-live="polite" style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {isSuccess && <CheckCircle2 size={18} color="#10b981" />}
          {isError && <AlertCircle size={18} color="#ef4444" />}
          {!isSuccess && !isError && <Info size={18} color="#3b82f6" />}
        </div>

        <div style={{ flex: 1, lineHeight: 1.45, fontWeight: 500, wordBreak: 'break-word' }}>
          {toast.message}
        </div>

        <button
          type="button"
          onClick={hideToast}
          style={{
            background: 'none',
            border: 'none',
            color: isError ? '#fca5a5' : '#a7f3d0',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '4px',
            opacity: 0.8,
            transition: 'opacity 0.15s ease',
          }}
          aria-label="알림 닫기"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
        >
          <X size={15} />
        </button>
      </div>
    </Portal>
  );
};
