import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type DemoThemeMode = 'dark' | 'light' | 'system';

export interface DemoPrefState {
  // 🎨 전역 영속 상태 (LocalStorage에 자동 저장 및 브라우저 시작 시 복원)
  themeMode: DemoThemeMode;
  isSundayStart: boolean;
  compactCardView: boolean;
  fontSize: number;
  lastSyncedAt: string | null;

  // ⚡ 액션 (Actions)
  setThemeMode: (mode: DemoThemeMode) => void;
  setSundayStart: (value: boolean) => void;
  setCompactCardView: (value: boolean) => void;
  setFontSize: (size: number) => void;

  // 🌐 가상 API 동기화 시뮬레이션
  simulateApiSync: () => Promise<void>;

  // 🔄 기본값 리셋
  resetDefaults: () => void;
}

export const useDemoPrefStore = create<DemoPrefState>()(
  persist(
    (set) => ({
      themeMode: 'dark',
      isSundayStart: false,
      compactCardView: false,
      fontSize: 14,
      lastSyncedAt: null,

      setThemeMode: (themeMode) => set({ themeMode }),
      setSundayStart: (isSundayStart) => set({ isSundayStart }),
      setCompactCardView: (compactCardView) => set({ compactCardView }),
      setFontSize: (fontSize) => set({ fontSize }),

      simulateApiSync: async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const mockApiResponse = {
          themeMode: 'light' as DemoThemeMode,
          isSundayStart: true,
          compactCardView: true,
          fontSize: 16,
          lastSyncedAt: new Date().toLocaleTimeString('ko-KR'),
        };
        set(mockApiResponse);
      },

      resetDefaults: () =>
        set({
          themeMode: 'dark',
          isSundayStart: false,
          compactCardView: false,
          fontSize: 14,
          lastSyncedAt: null,
        }),
    }),
    {
      name: 'ag_demo_preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
