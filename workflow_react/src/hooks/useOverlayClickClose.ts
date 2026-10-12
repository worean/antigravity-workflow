import React from 'react';

/**
 * 모달/팝업 오버레이(외부 영역)를 마우스로 직접 누르는(mousedown) 시점에만 모달을 닫도록 제어하는 공통 훅.
 * 모달 내부 요소(텍스트, 코드 블록 등)에서 드래그(mousedown)를 시작하여 마우스 커서를 모달 바깥에서 떼었을 때(mouseup),
 * 브라우저가 발생시키는 잔여 click 이벤트로 인해 모달이 의도치 않게 닫히는 현상을 완전히 방지합니다.
 */
export const useOverlayClickClose = (onClose: () => void) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 텍스트 드래그 완료 후 외부에서 마우스를 뗐을 때 발생하는 click 이벤트 차단
    if (e.target === e.currentTarget) {
      e.stopPropagation();
    }
  };

  return {
    onMouseDown: handleMouseDown,
    onClick: handleClick,
  };
};
