/**
 * AntiGravity Unified Calendar State Store
 * - 캘린더에서 사용자가 보고 있던 날짜, 뷰 모드(월간/주간), 필터 상태를 LocalStorage(ag_calendar_state)에 영속 저장
 * - 탭 이동, 페이지 새로고침, 재접속 시에도 직전에 조회 중이던 영역 완벽 복원
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CalendarViewMode } from '@/types';

export interface CalendarStoreState {
  // 메인 캘린더 보던 영역 상태
  currentDateStr: string; // ISO 8601 문자열
  viewMode: CalendarViewMode;
  selectedProjectId: number | 'ALL';
  onlyMyEvents: boolean;
  selectedDateStr: string | null;

  // 대시보드 미니 캘린더 위젯 보던 영역 상태
  miniCurrentDateStr: string;
  miniSelectedDateStr: string | null;

  // 메인 캘린더 액션
  setCurrentDate: (date: Date | string) => void;
  setViewMode: (viewMode: CalendarViewMode) => void;
  setSelectedProjectId: (projectId: number | 'ALL') => void;
  setOnlyMyEvents: (onlyMyEvents: boolean) => void;
  setSelectedDateStr: (dateStr: string | null) => void;
  navigateDate: (direction: 'prev' | 'next') => void;
  goToToday: () => void;

  // 미니 캘린더 액션
  setMiniCurrentDate: (date: Date | string) => void;
  setMiniSelectedDateStr: (dateStr: string | null) => void;
  navigateMiniMonth: (direction: 'prev' | 'next') => void;
  goToMiniToday: () => void;

  // 전체 리셋
  resetCalendarState: () => void;
}

const getInitialDateStr = (): string => new Date().toISOString();

const memoryStorage: Record<string, string> = {};
const getStorageInstance = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key: string) => memoryStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
    },
    key: (index: number) => Object.keys(memoryStorage)[index] ?? null,
    get length() {
      return Object.keys(memoryStorage).length;
    },
  };
};

export const useCalendarStore = create<CalendarStoreState>()(
  persist(
    (set, get) => ({
      currentDateStr: getInitialDateStr(),
      viewMode: 'month',
      selectedProjectId: 'ALL',
      onlyMyEvents: false,
      selectedDateStr: null,

      miniCurrentDateStr: getInitialDateStr(),
      miniSelectedDateStr: null,

      setCurrentDate: (date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString();
        set({ currentDateStr: dateStr });
      },

      setViewMode: (viewMode) => set({ viewMode }),

      setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),

      setOnlyMyEvents: (onlyMyEvents) => set({ onlyMyEvents }),

      setSelectedDateStr: (selectedDateStr) => set({ selectedDateStr }),

      navigateDate: (direction) => {
        const { currentDateStr, viewMode } = get();
        const baseDate = new Date(currentDateStr);
        if (isNaN(baseDate.getTime())) {
          set({ currentDateStr: getInitialDateStr() });
          return;
        }

        const nextDate = new Date(baseDate);
        if (viewMode === 'month') {
          nextDate.setMonth(nextDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else {
          nextDate.setDate(nextDate.getDate() + (direction === 'next' ? 7 : -7));
        }
        set({ currentDateStr: nextDate.toISOString() });
      },

      goToToday: () => {
        set({ currentDateStr: new Date().toISOString(), selectedDateStr: null });
      },

      setMiniCurrentDate: (date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString();
        set({ miniCurrentDateStr: dateStr });
      },

      setMiniSelectedDateStr: (miniSelectedDateStr) => set({ miniSelectedDateStr }),

      navigateMiniMonth: (direction) => {
        const { miniCurrentDateStr } = get();
        const baseDate = new Date(miniCurrentDateStr);
        if (isNaN(baseDate.getTime())) {
          set({ miniCurrentDateStr: getInitialDateStr() });
          return;
        }

        const nextDate = new Date(baseDate);
        nextDate.setMonth(nextDate.getMonth() + (direction === 'next' ? 1 : -1));
        set({ miniCurrentDateStr: nextDate.toISOString(), miniSelectedDateStr: null });
      },

      goToMiniToday: () => {
        set({ miniCurrentDateStr: new Date().toISOString(), miniSelectedDateStr: null });
      },

      resetCalendarState: () => {
        const today = new Date().toISOString();
        set({
          currentDateStr: today,
          viewMode: 'month',
          selectedProjectId: 'ALL',
          onlyMyEvents: false,
          selectedDateStr: null,
          miniCurrentDateStr: today,
          miniSelectedDateStr: null,
        });
      },
    }),
    {
      name: 'ag_calendar_state',
      storage: createJSONStorage(getStorageInstance),
    }
  )
);
