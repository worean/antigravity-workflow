import React from 'react';
import type { ResizeHandleType } from './useWidgetResize';

interface DashboardWidgetResizeHandlesProps {
  isResizing: boolean;
  previewColSpan: number;
  previewWidthPx?: number;
  previewHeight: number;
  isStatsWidget: boolean;
  onPointerDown: (type: ResizeHandleType, e: React.PointerEvent) => void;
}

export const DashboardWidgetResizeHandles: React.FC<DashboardWidgetResizeHandlesProps> = ({
  isResizing,
  previewColSpan,
  previewWidthPx,
  previewHeight,
  isStatsWidget,
  onPointerDown,
}) => {
  return (
    <>
      {/* Resizing Live Overlay Feedback */}
      {isResizing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 122, 204, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 30,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--primary)',
              borderRadius: 'var(--radius-xs)',
              padding: '6px 14px',
              boxShadow: 'var(--shadow-md)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📐 크기 조정:</span>
            <span>
              {previewWidthPx ? `${Math.round(previewWidthPx)}px (${Math.round((previewColSpan / 12) * 100)}%)` : `${previewColSpan}칸`}
            </span>
            {!isStatsWidget && <span>× {previewHeight}px</span>}
          </div>
        </div>
      )}

      {/* 1. Right Edge Handle (너비 리사이즈) */}
      <div
        onPointerDown={(e) => onPointerDown('width', e)}
        title="마우스로 드래그하여 위젯 너비 조절"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '8px',
          height: '100%',
          cursor: 'col-resize',
          zIndex: 20,
          transition: 'background 0.15s ease',
        }}
        className="widget-resize-handle-right"
      />

      {/* 2. Bottom Edge Handle (높이 리사이즈 - stats 제외) */}
      {!isStatsWidget && (
        <div
          onPointerDown={(e) => onPointerDown('height', e)}
          title="마우스로 드래그하여 위젯 높이 조절"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '8px',
            cursor: 'row-resize',
            zIndex: 20,
            transition: 'background 0.15s ease',
          }}
          className="widget-resize-handle-bottom"
        />
      )}

      {/* 3. Bottom-Right Corner Handle (너비 + 높이 동시 대각선 리사이즈) */}
      <div
        onPointerDown={(e) => onPointerDown(isStatsWidget ? 'width' : 'both', e)}
        title="마우스로 드래그하여 위젯 너비/높이 동시 조절"
        style={{
          position: 'absolute',
          bottom: 1,
          right: 1,
          width: '14px',
          height: '14px',
          cursor: isStatsWidget ? 'col-resize' : 'nwse-resize',
          zIndex: 25,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: '2px',
          opacity: 0.75,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="var(--primary)">
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="8" cy="4.5" r="1.2" />
          <circle cx="4.5" cy="8" r="1.2" />
        </svg>
      </div>
    </>
  );
};
