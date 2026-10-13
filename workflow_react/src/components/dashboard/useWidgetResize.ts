import { useState, useRef, useCallback } from 'react';
import type { DashboardWidgetHeight } from '@/types/dashboard';

interface UseWidgetResizeOptions {
  cardRef: React.RefObject<HTMLDivElement | null>;
  colSpan: number;
  height: DashboardWidgetHeight;
  customHeight?: number;
  isStatsWidget?: boolean;
  onUpdateColSpan: (colSpan: number) => void;
  onUpdateHeight: (height: DashboardWidgetHeight, customHeight?: number) => void;
}

export type ResizeHandleType = 'width' | 'height' | 'both';

export const HEIGHT_PRESETS: Record<DashboardWidgetHeight, number> = {
  compact: 260,
  normal: 390,
  tall: 560,
};

export const getHeightCategory = (heightPx: number): DashboardWidgetHeight => {
  if (heightPx < 300) return 'compact';
  if (heightPx > 470) return 'tall';
  return 'normal';
};

export function useWidgetResize({
  cardRef,
  colSpan,
  height,
  customHeight,
  isStatsWidget = false,
  onUpdateColSpan,
  onUpdateHeight,
}: UseWidgetResizeOptions) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<ResizeHandleType | null>(null);
  const [previewColSpan, setPreviewColSpan] = useState(colSpan);
  const [previewWidthPx, setPreviewWidthPx] = useState(400);
  const [previewHeight, setPreviewHeight] = useState<number>(
    customHeight || HEIGHT_PRESETS[height] || 390
  );

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startWidthPx: number;
    startColSpan: number;
    startHeight: number;
    colUnitPx: number;
  }>({
    startX: 0,
    startY: 0,
    startWidthPx: 400,
    startColSpan: colSpan,
    startHeight: customHeight || HEIGHT_PRESETS[height] || 390,
    colUnitPx: 80,
  });

  const latestColSpanRef = useRef(colSpan);
  const latestHeightRef = useRef<number>(customHeight || HEIGHT_PRESETS[height] || 390);

  const handlePointerDown = useCallback(
    (type: ResizeHandleType, e: React.PointerEvent) => {
      // stats 위젯은 높이 조절 불가, 너비만 가능
      if (isStatsWidget && type !== 'width') return;

      e.preventDefault();
      e.stopPropagation();

      const cardEl = cardRef.current;
      const parentEl = cardEl?.parentElement;

      // 12컬럼 그리드 시스템 1컬럼 너비(gap 10px 포함) 계산
      const gridWidth = parentEl?.clientWidth || 1200;
      const gap = 10;
      const colUnitPx = Math.max(30, (gridWidth + gap) / 12);

      const currentCardWidth = cardEl?.offsetWidth || 400;
      const currentCardHeight = cardEl?.offsetHeight || customHeight || HEIGHT_PRESETS[height] || 390;

      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidthPx: currentCardWidth,
        startColSpan: colSpan,
        startHeight: currentCardHeight,
        colUnitPx,
      };

      latestColSpanRef.current = colSpan;
      latestHeightRef.current = currentCardHeight;

      setPreviewColSpan(colSpan);
      setPreviewWidthPx(currentCardWidth);
      setPreviewHeight(currentCardHeight);
      setResizeType(type);
      setIsResizing(true);

      const target = e.currentTarget;
      if (target.setPointerCapture) {
        target.setPointerCapture(e.pointerId);
      }
    },
    [cardRef, colSpan, height, customHeight, isStatsWidget]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing || !resizeType) return;

      e.preventDefault();
      e.stopPropagation();

      const { startX, startY, startWidthPx, startColSpan, startHeight, colUnitPx } = dragStartRef.current;

      // 1. Width Calculation (픽셀 기반 연속 계산 -> 1 ~ 12칸 유연 스냅)
      if (resizeType === 'width' || resizeType === 'both') {
        const deltaX = e.clientX - startX;
        const currentPx = Math.max(180, startWidthPx + deltaX);
        const colDelta = Math.round(deltaX / colUnitPx);
        // 1칸부터 12칸까지 자유롭게 리사이즈 지원
        const nextColSpan = Math.min(12, Math.max(1, startColSpan + colDelta));
        latestColSpanRef.current = nextColSpan;
        setPreviewColSpan(nextColSpan);
        setPreviewWidthPx(currentPx);
      }

      // 2. Height Calculation (140px ~ 900px 자유 조절)
      if ((resizeType === 'height' || resizeType === 'both') && !isStatsWidget) {
        const deltaY = e.clientY - startY;
        const nextHeight = Math.min(900, Math.max(140, Math.round(startHeight + deltaY)));
        latestHeightRef.current = nextHeight;
        setPreviewHeight(nextHeight);
      }
    },
    [isResizing, resizeType, isStatsWidget]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return;

      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget;
      if (target.releasePointerCapture) {
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }

      const finalCol = latestColSpanRef.current;
      const finalH = latestHeightRef.current;

      // 영속화 업데이트
      if (finalCol !== colSpan) {
        onUpdateColSpan(finalCol);
      }

      if (!isStatsWidget) {
        const cat = getHeightCategory(finalH);
        onUpdateHeight(cat, finalH);
      }

      setIsResizing(false);
      setResizeType(null);
    },
    [isResizing, colSpan, isStatsWidget, onUpdateColSpan, onUpdateHeight]
  );

  return {
    isResizing,
    resizeType,
    previewColSpan,
    previewWidthPx,
    previewHeight,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
