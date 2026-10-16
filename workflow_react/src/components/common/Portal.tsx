import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolvePortalContainer } from '@/utils/modalUtils';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface PortalProps {
  children: React.ReactNode;
  /** 포털 대상 컨테이너 엘리먼트 ID (기본값: 'ag-portal-root') */
  containerId?: string;
  /** 특정 HTMLElement를 직접 지정하고 싶을 때 사용 */
  targetElement?: HTMLElement | null;
}

/**
 * Portal - React createPortal 기반의 공통 포털 래퍼 컴포넌트
 *
 * 부모 컴포넌트의 CSS 컨텍스트(overflow: hidden, transform, filter, z-index 등)에
 * 갇히지 않고 독립된 DOM 루트에 모달, 팝업, 툴팁, 토스트 등을 렌더링합니다.
 * 또한 마운트 시점에 루트 컨테이너의 가장 마지막 자식으로 레이어 노드를 배치하여
 * 나중에 열린 모달이 DOM 순서상으로도 항상 상위에 오도록 보장합니다.
 */
export const Portal: React.FC<PortalProps> = ({
  children,
  containerId = 'ag-portal-root',
  targetElement,
}) => {
  const layerNodeRef = useRef<HTMLDivElement | null>(null);
  const [, forceUpdate] = useState(0);

  if (typeof document !== 'undefined' && !layerNodeRef.current && typeof document.createElement === 'function') {
    const layerDiv = document.createElement('div');
    layerDiv.setAttribute('data-ag-portal-layer', 'true');
    layerNodeRef.current = layerDiv;
  }

  useIsomorphicLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    const rootContainer = resolvePortalContainer(targetElement, containerId);
    let layerEl = layerNodeRef.current;
    if (!layerEl && typeof document.createElement === 'function') {
      layerEl = document.createElement('div');
      layerEl.setAttribute('data-ag-portal-layer', 'true');
      layerNodeRef.current = layerEl;
      forceUpdate((n) => n + 1);
    }

    if (layerEl && rootContainer && typeof rootContainer.appendChild === 'function') {
      rootContainer.appendChild(layerEl);
    }

    return () => {
      if (layerEl && layerEl.parentNode) {
        layerEl.parentNode.removeChild(layerEl);
      }
    };
  }, [containerId, targetElement]);

  if (typeof document === 'undefined') {
    return null;
  }

  const target = layerNodeRef.current || resolvePortalContainer(targetElement, containerId);
  if (!target) return null;

  return createPortal(children, target);
};

