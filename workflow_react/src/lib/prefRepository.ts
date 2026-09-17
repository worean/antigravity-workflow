import type { User } from '@/types';
import { usePrefStore, DEFAULT_PREFS, type PrefSchema, type PrefStoreState } from '@/stores/usePrefStore';

export { DEFAULT_PREFS, type PrefSchema, type PrefStoreState } from '@/stores/usePrefStore';

/**
 * 🏛️ PrefRepository (Zustand 기반 통합 브릿지 클래스)
 * 
 * 기존의 모든 비-React 파일(apiClient, socketClient) 및 레거시 호출부와의 100% 하위 호환성을
 * 유지하면서, 내부적으로 Zustand `usePrefStore`를 사용하여 React의 실시간 반응성과
 * LocalStorage 자동 영속화를 완벽하게 제공합니다.
 */
export class PrefRepository {
  private static instance: PrefRepository;

  private constructor() {
    this.migrateLegacyStorage();
  }

  public static getInstance(): PrefRepository {
    if (!PrefRepository.instance) {
      PrefRepository.instance = new PrefRepository();
    }
    return PrefRepository.instance;
  }

  /**
   * 🔄 기존 개별 LocalStorage 키를 Zustand 단일 키('ag_preferences')로 안전 마이그레이션
   */
  private migrateLegacyStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const state = usePrefStore.getState();
      const legacyToken = localStorage.getItem('auth_token');
      const legacyUser = localStorage.getItem('user');
      const legacySunday = localStorage.getItem('pref_is_sunday_start');
      const legacyPriority = localStorage.getItem('pref_default_priority');
      const legacyCompact = localStorage.getItem('pref_compact_cards');
      const legacyNoti = localStorage.getItem('pref_desktop_notifications');
      const legacyApiUrl = localStorage.getItem('pref_backend_api_url');
      const legacyWs = localStorage.getItem('active_workspace_id');

      const updates: Partial<PrefStoreState> = {};
      if (legacyToken && !state.authToken) updates.authToken = legacyToken;
      if (legacyUser && !state.currentUser) {
        try {
          updates.currentUser = JSON.parse(legacyUser);
        } catch {}
      }
      if (legacySunday !== null && state.isSundayStart === DEFAULT_PREFS.isSundayStart) {
        updates.isSundayStart = legacySunday === 'true';
      }
      if (legacyPriority && state.defaultPriority === DEFAULT_PREFS.defaultPriority) {
        const num = Number(legacyPriority);
        if (!isNaN(num)) updates.defaultPriority = num;
      }
      if (legacyCompact !== null && state.compactCards === DEFAULT_PREFS.compactCards) {
        updates.compactCards = legacyCompact === 'true';
      }
      if (legacyNoti !== null && state.desktopNotifications === DEFAULT_PREFS.desktopNotifications) {
        updates.desktopNotifications = legacyNoti !== 'false';
      }
      if (legacyApiUrl && !state.backendApiUrl) updates.backendApiUrl = legacyApiUrl;
      if (legacyWs && !state.activeWorkspaceId) {
        const wsNum = Number(legacyWs);
        if (!isNaN(wsNum)) updates.activeWorkspaceId = wsNum;
      }

      if (Object.keys(updates).length > 0) {
        usePrefStore.setState(updates);
      }
    } catch (e) {
      console.warn('[PrefRepository] Migration failed:', e);
    }
  }

  // --- 🔹 프로퍼티 Getters & Setters (Zustand 스토어와 실시간 동기화) ---

  public get isSundayStart(): boolean {
    return usePrefStore.getState().isSundayStart;
  }
  public set isSundayStart(value: boolean) {
    usePrefStore.getState().setSundayStart(value);
  }

  public get defaultPriority(): number {
    return usePrefStore.getState().defaultPriority;
  }
  public set defaultPriority(value: number) {
    usePrefStore.getState().setDefaultPriority(value);
  }

  public get compactCards(): boolean {
    return usePrefStore.getState().compactCards;
  }
  public set compactCards(value: boolean) {
    usePrefStore.getState().setCompactCards(value);
  }

  public get desktopNotifications(): boolean {
    return usePrefStore.getState().desktopNotifications;
  }
  public set desktopNotifications(value: boolean) {
    usePrefStore.getState().setDesktopNotifications(value);
  }

  public get backendApiUrl(): string {
    return usePrefStore.getState().backendApiUrl;
  }
  public set backendApiUrl(value: string) {
    usePrefStore.getState().setBackendApiUrl(value);
  }

  public get activeWorkspaceId(): number | null {
    return usePrefStore.getState().activeWorkspaceId;
  }
  public set activeWorkspaceId(value: number | null) {
    usePrefStore.getState().setActiveWorkspaceId(value);
  }

  public get activeTab(): string {
    return usePrefStore.getState().activeTab;
  }
  public set activeTab(value: string) {
    usePrefStore.getState().setActiveTab(value);
  }

  // --- 🔐 인증 및 세션 관리 ---
  public get authToken(): string | null {
    return usePrefStore.getState().authToken;
  }
  public set authToken(token: string | null) {
    usePrefStore.getState().setAuthToken(token);
    // 레거시 외부 라이브러리/스크립트 호환용
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('auth_token', token);
      else localStorage.removeItem('auth_token');
    }
  }

  public get currentUser(): User | null {
    return usePrefStore.getState().currentUser;
  }
  public set currentUser(user: User | null) {
    usePrefStore.getState().setCurrentUser(user);
    if (typeof window !== 'undefined') {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
    }
  }

  public clearAuth(): void {
    usePrefStore.getState().clearAuth();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  // --- 📦 일괄 관리 메서드 ---
  public getAll(): PrefSchema {
    const s = usePrefStore.getState();
    return {
      isSundayStart: s.isSundayStart,
      defaultPriority: s.defaultPriority,
      compactCards: s.compactCards,
      desktopNotifications: s.desktopNotifications,
      backendApiUrl: s.backendApiUrl,
      activeWorkspaceId: s.activeWorkspaceId,
      activeTab: s.activeTab,
    };
  }

  public update(partial: Partial<PrefSchema>): void {
    usePrefStore.getState().updatePrefs(partial);
  }

  public resetToDefaults(): void {
    usePrefStore.getState().resetToDefaults();
  }

  public syncFromUserProfile(userPreferencesJsonOrObj: string | object | null | undefined): void {
    usePrefStore.getState().syncFromUserProfile(userPreferencesJsonOrObj);
  }

  public exportToUserProfile(): string {
    return usePrefStore.getState().exportToUserProfile();
  }
}

/**
 * 🌟 싱글톤 인스턴스 export
 */
export const prefRepository = PrefRepository.getInstance();
export const prefRepo = prefRepository;

/**
 * 🎯 React 컴포넌트 전용 리액티브 구독 훅 (Zustand Selector 기반)
 */
export function usePreference<T>(selector: (state: PrefStoreState) => T): T {
  return usePrefStore(selector);
}
