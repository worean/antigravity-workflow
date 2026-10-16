import { useEffect, useId, useLayoutEffect, useState } from 'react';
import { modalRegistry, MODAL_Z_INDEX, type ModalRegistrationOptions } from '@/utils/modalUtils';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface UseModalLayerOptions extends ModalRegistrationOptions {
  id?: string;
  onClose?: () => void;
  /**
   * 이미 열려 있는 모달/드로어라도 대상 키(예: issueId, memoId 등)가 변경되면
   * 즉시 모달 스택 최상단으로 재등록하여 기존 모달 위로 끌어올립니다.
   */
  triggerKey?: unknown;
}

/**
 * 모든 모달 및 슬라이드 드로어의 계층(z-index)과 ESC 닫기 순서를 통합 관리하는 훅
 */
export const useModalLayer = (isOpen: boolean, options: UseModalLayerOptions = {}) => {
  const autoId = useId();
  const modalId = options.id || autoId;
  const { baseZIndex, isConfirm, onClose, triggerKey } = options;

  const [effectiveZIndex, setEffectiveZIndex] = useState<number>(() =>
    isOpen
      ? modalRegistry.peekNextZIndex({ baseZIndex, isConfirm })
      : (baseZIndex ?? (isConfirm ? MODAL_Z_INDEX.CONFIRM_ALERT_BASE : MODAL_Z_INDEX.MODAL_BASE))
  );

  // 1. 모달 열림 또는 triggerKey 변경 시 스택 최상단에 등록하여 항상 최고 z-index 부여
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;

    const calculatedZ = modalRegistry.register(modalId, {
      baseZIndex,
      isConfirm,
    });
    setEffectiveZIndex(calculatedZ);
  }, [isOpen, modalId, baseZIndex, isConfirm, triggerKey]);

  // 2. 모달 닫힘/언마운트 시 스택 해제
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;
    return () => {
      modalRegistry.unregister(modalId);
    };
  }, [isOpen, modalId]);

  // 3. 최상위(Top) 모달인 경우에만 ESC 키 입력 시 닫기
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const topId = modalRegistry.getTopModalId();
        if (topId === modalId || !topId) {
          e.stopPropagation();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, modalId, onClose]);

  return {
    modalId,
    effectiveZIndex,
    zIndex: effectiveZIndex,
  };
};
