import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

export interface PrefSchema {
  isSundayStart: boolean;
  defaultPriority: number;
  compactCards: boolean;
  desktopNotifications: boolean;
  backendApiUrl: string;
  activeWorkspaceId: number | null;
  activeTab: string;
}

export const DEFAULT_PREFS: PrefSchema = {
  isSundayStart: false,
  defaultPriority: 3,
  compactCards: false,
  desktopNotifications: true,
  backendApiUrl: '',
  activeWorkspaceId: null,
  activeTab: 'dashboard',
};

export interface PrefStoreState extends PrefSchema {
  // 인증 및 세션
  authToken: string | null;
  currentUser: User | null;

  // 단일 속성 세터
  setSundayStart: (value: boolean) => void;
  setDefaultPriority: (value: number) => void;
  setCompactCards: (value: boolean) => void;
  setDesktopNotifications: (value: boolean) => void;
  setBackendApiUrl: (value: string) => void;
  setActiveWorkspaceId: (value: number | null) => void;
  setActiveTab: (value: string) => void;

  // 인증 세터
  setAuthToken: (token: string | null) => void;
  setCurrentUser: (user: User | null) => void;
  clearAuth: () => void;

  // 일괄 업데이트 & 백엔드 동기화
  updatePrefs: (partial: Partial<PrefSchema>) => void;
  resetToDefaults: () => void;
  syncFromUserProfile: (userPreferencesJsonOrObj: string | object | null | undefined) => void;
  exportToUserProfile: () => string;
}

export const usePrefStore = create<PrefStoreState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFS,
      authToken: null,
      currentUser: null,

      setSundayStart: (isSundayStart) => set({ isSundayStart }),
      setDefaultPriority: (defaultPriority) => set({ defaultPriority }),
      setCompactCards: (compactCards) => set({ compactCards }),
      setDesktopNotifications: (desktopNotifications) => set({ desktopNotifications }),
      setBackendApiUrl: (backendApiUrl) => set({ backendApiUrl }),
      setActiveWorkspaceId: (activeWorkspaceId) => set({ activeWorkspaceId }),
      setActiveTab: (activeTab) => set({ activeTab }),

      setAuthToken: (authToken) => set({ authToken }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      clearAuth: () => set({ authToken: null, currentUser: null }),

      updatePrefs: (partial) => set((state) => ({ ...state, ...partial })),
      resetToDefaults: () => set({ ...DEFAULT_PREFS }),

      syncFromUserProfile: (userPreferencesJsonOrObj) => {
        if (!userPreferencesJsonOrObj) return;
        try {
          const prefs =
            typeof userPreferencesJsonOrObj === 'string'
              ? JSON.parse(userPreferencesJsonOrObj)
              : userPreferencesJsonOrObj;

          const updates: Partial<PrefSchema> = {};
          if (typeof prefs.isSundayStart === 'boolean') updates.isSundayStart = prefs.isSundayStart;
          if (typeof prefs.defaultPriority === 'number') updates.defaultPriority = prefs.defaultPriority;
          if (typeof prefs.compactCards === 'boolean') updates.compactCards = prefs.compactCards;
          if (typeof prefs.desktopNotifications === 'boolean') updates.desktopNotifications = prefs.desktopNotifications;

          set((state) => ({ ...state, ...updates }));
        } catch (e) {
          console.warn('[usePrefStore] Failed to sync preferences from user profile:', e);
        }
      },

      exportToUserProfile: () => {
        const state = get();
        return JSON.stringify({
          isSundayStart: state.isSundayStart,
          defaultPriority: state.defaultPriority,
          compactCards: state.compactCards,
          desktopNotifications: state.desktopNotifications,
        });
      },
    }),
    {
      name: 'ag_preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
