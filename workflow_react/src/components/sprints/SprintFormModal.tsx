import React from 'react';
import { Portal } from '@/components/common/Portal';
import { SprintModal, type SprintModalProps } from '../SprintModal';

export type SprintFormModalProps = SprintModalProps;

/**
 * SprintFormModal — Portal 기반 SprintModal 래퍼 컴포넌트
 */
export const SprintFormModal: React.FC<SprintFormModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <Portal>
      <SprintModal {...props} />
    </Portal>
  );
};

export { SprintModal };