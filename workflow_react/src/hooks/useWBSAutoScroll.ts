﻿import { useRef, useEffect, useCallback, type RefObject } from 'react';

interface UseWBSAutoScrollProps {
  isDragging: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  headerContainerRef?: RefObject<HTMLDivElement | null>;
  edgeZone?: number;
  maxScrollSpeed?: number;
  onScrollTick?: (clientX: number, newScrollLeft: number) => void;
}

/**
 * 간트차트 바 드래그 시 양 끝 엣지 영역에 마우스가 도달하면 자동으로 가로 스크롤하는 훅
 */
export const useWBSAutoScroll = ({
  isDragging,
  scrollContainerRef,
  headerContainerRef,
  edgeZone = 70,
  maxScrollSpeed = 12,
  onScrollTick,
}: UseWBSAutoScrollProps) => {
  const lastMousePosRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const updateMousePos = useCallback((clientX: number, clientY: number) => {
    lastMousePosRef.current = { clientX, clientY };
  }, []);

  const clearMousePos = useCallback(() => {
    lastMousePosRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const autoScrollLoop = () => {
      if (!isDragging || !scrollContainerRef.current || !lastMousePosRef.current) {
        animFrameRef.current = requestAnimationFrame(autoScrollLoop);
        return;
      }

      const rect = scrollContainerRef.current.getBoundingClientRect();
      const clientX = lastMousePosRef.current.clientX;

      let scrollDelta = 0;

      // 좌측 엣지 감지
      if (clientX < rect.left + edgeZone && clientX >= rect.left - 60) {
        const dist = rect.left + edgeZone - clientX;
        const ratio = Math.min(1, Math.max(0.15, dist / edgeZone));
        scrollDelta = -Math.round(ratio * maxScrollSpeed);
      }
      // 우측 엣지 감지
      else if (clientX > rect.right - edgeZone && clientX <= rect.right + 60) {
        const dist = clientX - (rect.right - edgeZone);
        const ratio = Math.min(1, Math.max(0.15, dist / edgeZone));
        scrollDelta = Math.round(ratio * maxScrollSpeed);
      }

      if (scrollDelta !== 0) {
        const currentScroll = scrollContainerRef.current.scrollLeft;
        const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
        const targetScroll = Math.max(0, Math.min(maxScroll, currentScroll + scrollDelta));

        if (targetScroll !== currentScroll) {
          scrollContainerRef.current.scrollLeft = targetScroll;
          if (headerContainerRef?.current) {
            headerContainerRef.current.scrollLeft = targetScroll;
          }
          if (onScrollTick) {
            onScrollTick(clientX, targetScroll);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(autoScrollLoop);
    };

    animFrameRef.current = requestAnimationFrame(autoScrollLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isDragging, edgeZone, maxScrollSpeed, scrollContainerRef, headerContainerRef, onScrollTick]);

  return {
    updateMousePos,
    clearMousePos,
    lastMousePosRef,
  };
};
