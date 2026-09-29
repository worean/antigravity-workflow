import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMemoStore } from '@/stores/useMemoStore';
import { Portal } from '@/components/common/Portal';
import { MarkdownViewer } from '@/components/common/MarkdownViewer';
import { Edit3, Pin } from 'lucide-react';

export interface MemoIndicatorProps {
  issueId: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const MemoIndicator: React.FC<MemoIndicatorProps> = ({
  issueId,
  size = 14,
  className = '',
  style = {},
}) => {
  const memos = useMemoStore((s) => s.memos);
  const setActiveMemoId = useMemoStore((s) => s.setActiveMemoId);
  const memo = useMemo(() => memos.find((m) => m.issueId === issueId), [memos, issueId]);

  const [isHovered, setIsHovered] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);

  const indicatorRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculatePosition = () => {
    if (!indicatorRef.current) return;
    const rect = indicatorRef.current.getBoundingClientRect();
    const popoverWidth = 280;
    const popoverHeight = 220;

    let left = rect.left;
    let top = rect.bottom + 6;

    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }
    if (top + popoverHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - popoverHeight - 6);
    }

    setPopoverCoords({ top, left });
  };

  const handleMouseEnter = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    calculatePosition();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!memo) return null;

  const handleOpenEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsHovered(false);
    setActiveMemoId(memo.id);
  };

  return (
    <>
      <div
        ref={indicatorRef}
        className={`memo-corner-indicator ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleOpenEditor}
        onDoubleClick={handleOpenEditor}
        title="작성된 개인 메모가 있습니다 (클릭하여 편집)"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#ef4444',
          clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          zIndex: 25,
          cursor: 'pointer',
          transition: 'transform 0.15s ease, filter 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          ...style,
        }}
      />

      {isHovered && popoverCoords && (
        <Portal containerId="ag-portal-root">
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              width: '280px',
              maxWidth: '90vw',
              maxHeight: '260px',
              zIndex: 99999,
              background: '#202022',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(239, 68, 68, 0.3)',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              userSelect: 'text',
              overflow: 'hidden',
              animation: 'fadeIn 0.12s ease-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #333336',
                paddingBottom: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                  }}
                />
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                  내 개인 메모 (#{issueId})
                </span>
                {memo.isPinned && <Pin size={11} color="#eab308" fill="#eab308" />}
              </div>

              <button
                type="button"
                onClick={handleOpenEditor}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '0.7rem',
                  borderRadius: '3px',
                }}
                title="확대하여 편집"
              >
                <Edit3 size={11} />
                <span>편집</span>
              </button>
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-main)',
                lineHeight: 1.4,
                maxHeight: '180px',
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              <MarkdownViewer
                content={memo.content}
                placeholder="내용이 없는 빈 메모입니다."
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0',
                  fontSize: '0.76rem',
                }}
              />
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};
