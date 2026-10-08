﻿import type { DragState } from '@/types/wbs';
import { addDays } from '../dateUtils';

/**
 * 마우스 이동거리 및 스크롤 위치로부터 자석 스냅(Snap) 날짜 계산
 */
export const calculateSnapDates = (
  currentDrag: DragState,
  clientX: number,
  scrollLeft: number,
  dayWidth: number
): { nextStart: Date; nextDue: Date } => {
  const deltaMouse = clientX - currentDrag.startX;
  const deltaScroll = scrollLeft - currentDrag.initialScrollLeft;
  const totalDeltaX = deltaMouse + deltaScroll;
  const snapDays = Math.round(totalDeltaX / dayWidth);

  let nextStart = currentDrag.originalStartDate;
  let nextDue = currentDrag.originalDueDate;

  if (currentDrag.type === 'move') {
    nextStart = addDays(currentDrag.originalStartDate, snapDays);
    nextDue = addDays(currentDrag.originalDueDate, snapDays);
  } else if (currentDrag.type === 'resize-left') {
    const candidateStart = addDays(currentDrag.originalStartDate, snapDays);
    if (candidateStart <= currentDrag.originalDueDate) {
      nextStart = candidateStart;
    } else {
      nextStart = currentDrag.originalDueDate;
    }
    nextDue = currentDrag.originalDueDate;
  } else if (currentDrag.type === 'resize-right') {
    const candidateDue = addDays(currentDrag.originalDueDate, snapDays);
    if (candidateDue >= currentDrag.originalStartDate) {
      nextDue = candidateDue;
    } else {
      nextDue = currentDrag.originalStartDate;
    }
    nextStart = currentDrag.originalStartDate;
  }

  return { nextStart, nextDue };
};
