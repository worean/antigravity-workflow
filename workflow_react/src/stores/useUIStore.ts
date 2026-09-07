import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UIStoreState {
  // 사이드바 서브메뉴(아코디언) 펼침 상태
  sidebarSubmenus: Record<string, boolean>;
  setSidebarSubmenus: (
    action: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  toggleSidebarSubmenu: (menuId: string) => void;

  // 네비게이션 및 이전 라우트 이력
  prevRoute: string | null;
  setPrevRoute: (route: string | null) => void;

  // 글로벌 모달 열림 상태
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      sidebarSubmenus: {
        projects: false,
        issues: false,
        sprints: false,
        wbs: false,
        chat: false,
      },
      setSidebarSubmenus: (action) =>
        set((state) => ({
          sidebarSubmenus:
            typeof action === 'function' ? action(state.sidebarSubmenus) : action,
        })),
      toggleSidebarSubmenu: (menuId) =>
        set((state) => ({
          sidebarSubmenus: {
            ...state.sidebarSubmenus,
            [menuId]: !state.sidebarSubmenus[menuId],
          },
        })),

      prevRoute: null,
      setPrevRoute: (prevRoute) => set({ prevRoute }),

      isAuthModalOpen: false,
      setIsAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
    }),
    {
      name: 'ag_ui_state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
