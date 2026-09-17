import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
 */
export const Portal: React.FC<PortalProps> = ({
  children,
  containerId = 'ag-portal-root',
  targetElement,
}) => {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);

    if (targetElement) {
      setContainer(targetElement);
      return;
    }

    // 지정된 ID의 컨테이너를 찾거나 새로 생성하여 body 하위에 부착
    let el = document.getElementById(containerId);
    let created = false;

    if (!el) {
      el = document.createElement('div');
      el.id = containerId;
      document.body.appendChild(el);
      created = true;
    }

    setContainer(el);

    return () => {
      // 본 컴포넌트가 동적으로 생성했고 자식이 모두 비었을 경우만 정리
      if (created && el && el.childNodes.length === 0 && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, [containerId, targetElement]);

  if (!mounted || !container) {
    return null;
  }

  return createPortal(children, container);
};
