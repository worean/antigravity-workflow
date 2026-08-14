import React, { useRef } from 'react';

/**
 * 팝업 오버레이(배경)를 마우스로 직접 누르고 뗐을 때만 모달이 닫히도록 제어하는 커스텀 훅.
 * 팝업 내부 요소(텍스트, 드롭다운 등)에서 mousedown을 시작하여 마우스 커서를 팝업 바깥에서 떼었을 때(mouseup)
 * 모달이 예기치 않게 닫히는 현상을 완전히 방지합니다.
 */
export const useOverlayClickClose = (onClose: () => void) => {
  const isMouseDownOnOverlay = useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      isMouseDownOnOverlay.current = true;
    } else {
      isMouseDownOnOverlay.current = false;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && isMouseDownOnOverlay.current) {
      onClose();
    }
    isMouseDownOnOverlay.current = false;
  };

  return {
    onMouseDown: handleMouseDown,
    onClick: handleClick,
  };
};
