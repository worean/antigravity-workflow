import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

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

  // 🌐 글로벌 모달 상태 제어
  // 1) 인증/로그인 모달
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setIsAuthModalOpen: (open: boolean) => void;

  // 2) 전역 빠른 일감 생성 모달
  isIssueModalOpen: boolean;
  issueModalInitialProjectId: number | null;
  openIssueModal: (projectId?: number | null) => void;
  closeIssueModal: () => void;
  setIsIssueModalOpen: (open: boolean) => void;

  // 3) 전역 프로젝트 생성 모달
  isProjectModalOpen: boolean;
  openProjectModal: () => void;
  closeProjectModal: () => void;
  setIsProjectModalOpen: (open: boolean) => void;

  // 4) 🍞 전역 토스트 알림 상태 (3초 자동 소멸 & 신규 알림 시 즉시 리셋)
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

let toastTimer: any = null;

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

      // 인증 모달 제어
      isAuthModalOpen: false,
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      setIsAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),

      // 이슈 모달 제어
      isIssueModalOpen: false,
      issueModalInitialProjectId: null,
      openIssueModal: (projectId = null) =>
        set({ isIssueModalOpen: true, issueModalInitialProjectId: projectId }),
      closeIssueModal: () =>
        set({ isIssueModalOpen: false, issueModalInitialProjectId: null }),
      setIsIssueModalOpen: (isIssueModalOpen) => set({ isIssueModalOpen }),

      // 프로젝트 모달 제어
      isProjectModalOpen: false,
      openProjectModal: () => set({ isProjectModalOpen: true }),
      closeProjectModal: () => set({ isProjectModalOpen: false }),
      setIsProjectModalOpen: (isProjectModalOpen) => set({ isProjectModalOpen }),

      // 🍞 전역 토스트 알림 제어
      toast: null,
      showToast: (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        if (toastTimer) {
          clearTimeout(toastTimer);
          toastTimer = null;
        }

        const id = Date.now();
        set({ toast: { id, message, type } });

        toastTimer = setTimeout(() => {
          set({ toast: null });
          toastTimer = null;
        }, 3000);
      },
      hideToast: () => {
        if (toastTimer) {
          clearTimeout(toastTimer);
          toastTimer = null;
        }
        set({ toast: null });
      },
    }),
    {
      name: 'ag_ui_state',
      storage: createJSONStorage(() => localStorage),
      // 모달/토스트 열림 여부는 일시적 UI 상태이므로 영속화에서 제외
      partialize: (state) => ({
        sidebarSubmenus: state.sidebarSubmenus,
      }),
    }
  )
);
