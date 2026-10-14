import { describe, it, expect, beforeEach } from 'vitest';
import { useCalendarStore } from '../stores/useCalendarStore';

describe('useCalendarStore', () => {
  beforeEach(() => {
    useCalendarStore.getState().resetCalendarState();
  });

  it('초기 캘린더 상태가 올바르게 설정되어야 한다', () => {
    const state = useCalendarStore.getState();
    expect(state.viewMode).toBe('month');
    expect(state.selectedProjectId).toBe('ALL');
    expect(state.onlyMyEvents).toBe(false);
    expect(state.selectedDateStr).toBeNull();
    expect(state.currentDateStr).toBeDefined();
  });

  it('setCurrentDate 및 setViewMode가 정상적으로 상태를 갱신해야 한다', () => {
    const targetDate = new Date(2026, 11, 25); // 2026-12-25
    useCalendarStore.getState().setCurrentDate(targetDate);
    useCalendarStore.getState().setViewMode('week');

    const state = useCalendarStore.getState();
    expect(new Date(state.currentDateStr).getFullYear()).toBe(2026);
    expect(new Date(state.currentDateStr).getMonth()).toBe(11);
    expect(new Date(state.currentDateStr).getDate()).toBe(25);
    expect(state.viewMode).toBe('week');
  });

  it('월간 모드에서 navigateDate prev/next 호출 시 월 단위로 이동해야 한다', () => {
    useCalendarStore.getState().setViewMode('month');
    useCalendarStore.getState().setCurrentDate(new Date(2026, 5, 15)); // 2026년 6월 15일

    useCalendarStore.getState().navigateDate('next');
    let date = new Date(useCalendarStore.getState().currentDateStr);
    expect(date.getMonth()).toBe(6); // 7월

    useCalendarStore.getState().navigateDate('prev');
    useCalendarStore.getState().navigateDate('prev');
    date = new Date(useCalendarStore.getState().currentDateStr);
    expect(date.getMonth()).toBe(4); // 5월
  });

  it('주간 모드에서 navigateDate prev/next 호출 시 7일 단위로 이동해야 한다', () => {
    useCalendarStore.getState().setViewMode('week');
    useCalendarStore.getState().setCurrentDate(new Date(2026, 9, 10)); // 10월 10일

    useCalendarStore.getState().navigateDate('next');
    let date = new Date(useCalendarStore.getState().currentDateStr);
    expect(date.getDate()).toBe(17);

    useCalendarStore.getState().navigateDate('prev');
    date = new Date(useCalendarStore.getState().currentDateStr);
    expect(date.getDate()).toBe(10);
  });

  it('goToToday 호출 시 오늘 날짜로 즉시 복귀해야 한다', () => {
    useCalendarStore.getState().setCurrentDate(new Date(2020, 0, 1));
    useCalendarStore.getState().goToToday();

    const currentYear = new Date().getFullYear();
    const stateYear = new Date(useCalendarStore.getState().currentDateStr).getFullYear();
    expect(stateYear).toBe(currentYear);
  });

  it('미니 캘린더 월간 이동 navigateMiniMonth가 정상 동작해야 한다', () => {
    useCalendarStore.getState().setMiniCurrentDate(new Date(2026, 2, 1)); // 2026년 3월
    useCalendarStore.getState().navigateMiniMonth('next');

    const date = new Date(useCalendarStore.getState().miniCurrentDateStr);
    expect(date.getMonth()).toBe(3); // 4월
  });
});
