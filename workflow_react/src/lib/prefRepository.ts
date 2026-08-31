// -*- coding: utf-8 -*-
import type { User } from '@/types';

/**
 * 🛠️ 앱 환경설정 데이터 스키마 (App Preference Schema)
 */
export interface PrefSchema {
  isSundayStart: boolean;
  defaultPriority: number;
  compactCards: boolean;
  desktopNotifications: boolean;
  backendApiUrl: string;
  activeWorkspaceId: number | null;
  activeTab: string;
  selectedProjectId: number | null;
}

/**
 * 🌟 기본 설정값 (Default Preferences)
 */
export const DEFAULT_PREFS: PrefSchema = {
  isSundayStart: false,
  defaultPriority: 3,
  compactCards: false,
  desktopNotifications: true,
  backendApiUrl: '',
  activeWorkspaceId: null,
  activeTab: 'dashboard',
  selectedProjectId: null,
};

/**
 * 🏛️ PrefRepository (설정 저장소 Repository 패턴 구현체)
 * 
 * LocalStorage의 키 매핑 및 타입 변환, 유저 프로필 동기화를 전담 관리합니다.
 */
export class PrefRepository {
  private static instance: PrefRepository;

  // LocalStorage 키 매핑
  private readonly keys: Record<keyof PrefSchema, string> = {
    isSundayStart: 'pref_is_sunday_start',
    defaultPriority: 'pref_default_priority',
    compactCards: 'pref_compact_cards',
    desktopNotifications: 'pref_desktop_notifications',
    backendApiUrl: 'pref_backend_api_url',
    activeWorkspaceId: 'active_workspace_id',
    activeTab: 'activeTab',
    selectedProjectId: 'selectedProjectId',
  };

  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user';

  private constructor() {}

  public static getInstance(): PrefRepository {
    if (!PrefRepository.instance) {
      PrefRepository.instance = new PrefRepository();
    }
    return PrefRepository.instance;
  }

  // --- 🔒 내부 스토리지 안전 I/O ---
  private readStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch {
      return fallback;
    }
  }

  private writeStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        window.localStorage.setItem(key, serialized);
      }
    } catch (e) {
      console.warn(`[PrefRepository] Failed to write key "${key}":`, e);
    }
  }

  private removeStorage(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }

  // --- 🔹 프로퍼티 Getters & Setters ---

  public get isSundayStart(): boolean {
    const val = this.readStorage<any>(this.keys.isSundayStart, DEFAULT_PREFS.isSundayStart);
    return val === true || val === 'true';
  }
  public set isSundayStart(value: boolean) {
    this.writeStorage(this.keys.isSundayStart, value);
  }

  public get defaultPriority(): number {
    const val = this.readStorage<any>(this.keys.defaultPriority, DEFAULT_PREFS.defaultPriority);
    const num = Number(val);
    return isNaN(num) || num <= 0 ? DEFAULT_PREFS.defaultPriority : num;
  }
  public set defaultPriority(value: number) {
    this.writeStorage(this.keys.defaultPriority, value);
  }

  public get compactCards(): boolean {
    const val = this.readStorage<any>(this.keys.compactCards, DEFAULT_PREFS.compactCards);
    return val === true || val === 'true';
  }
  public set compactCards(value: boolean) {
    this.writeStorage(this.keys.compactCards, value);
  }

  public get desktopNotifications(): boolean {
    const val = this.readStorage<any>(this.keys.desktopNotifications, DEFAULT_PREFS.desktopNotifications);
    return val !== false && val !== 'false';
  }
  public set desktopNotifications(value: boolean) {
    this.writeStorage(this.keys.desktopNotifications, value);
  }

  public get backendApiUrl(): string {
    return this.readStorage<string>(this.keys.backendApiUrl, DEFAULT_PREFS.backendApiUrl);
  }
  public set backendApiUrl(value: string) {
    this.writeStorage(this.keys.backendApiUrl, value);
  }

  public get activeWorkspaceId(): number | null {
    const val = this.readStorage<any>(this.keys.activeWorkspaceId, null);
    if (!val) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }
  public set activeWorkspaceId(value: number | null) {
    this.writeStorage(this.keys.activeWorkspaceId, value);
  }

  public get activeTab(): string {
    return this.readStorage<string>(this.keys.activeTab, DEFAULT_PREFS.activeTab);
  }
  public set activeTab(value: string) {
    this.writeStorage(this.keys.activeTab, value);
  }

  public get selectedProjectId(): number | null {
    const val = this.readStorage<any>(this.keys.selectedProjectId, null);
    if (!val) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }
  public set selectedProjectId(value: number | null) {
    this.writeStorage(this.keys.selectedProjectId, value);
  }

  // --- 🔐 인증 및 세션 관리 ---
  public get authToken(): string | null {
    return this.readStorage<string | null>(this.AUTH_TOKEN_KEY, null);
  }
  public set authToken(token: string | null) {
    this.writeStorage(this.AUTH_TOKEN_KEY, token);
  }

  public get currentUser(): User | null {
    return this.readStorage<User | null>(this.USER_KEY, null);
  }
  public set currentUser(user: User | null) {
    this.writeStorage(this.USER_KEY, user);
  }

  public clearAuth(): void {
    this.removeStorage(this.AUTH_TOKEN_KEY);
    this.removeStorage(this.USER_KEY);
  }

  // --- 📦 일괄 관리 메서드 ---
  public getAll(): PrefSchema {
    return {
      isSundayStart: this.isSundayStart,
      defaultPriority: this.defaultPriority,
      compactCards: this.compactCards,
      desktopNotifications: this.desktopNotifications,
      backendApiUrl: this.backendApiUrl,
      activeWorkspaceId: this.activeWorkspaceId,
      activeTab: this.activeTab,
      selectedProjectId: this.selectedProjectId,
    };
  }

  public update(partial: Partial<PrefSchema>): void {
    if (partial.isSundayStart !== undefined) this.isSundayStart = partial.isSundayStart;
    if (partial.defaultPriority !== undefined) this.defaultPriority = partial.defaultPriority;
    if (partial.compactCards !== undefined) this.compactCards = partial.compactCards;
    if (partial.desktopNotifications !== undefined) this.desktopNotifications = partial.desktopNotifications;
    if (partial.backendApiUrl !== undefined) this.backendApiUrl = partial.backendApiUrl;
    if (partial.activeWorkspaceId !== undefined) this.activeWorkspaceId = partial.activeWorkspaceId;
    if (partial.activeTab !== undefined) this.activeTab = partial.activeTab;
    if (partial.selectedProjectId !== undefined) this.selectedProjectId = partial.selectedProjectId;
  }

  public resetToDefaults(): void {
    this.update(DEFAULT_PREFS);
  }

  // --- 🔄 백엔드 사용자 프로필 동기화 ---
  public syncFromUserProfile(userPreferencesJsonOrObj: string | object | null | undefined): void {
    if (!userPreferencesJsonOrObj) return;

    try {
      const prefs =
        typeof userPreferencesJsonOrObj === 'string'
          ? JSON.parse(userPreferencesJsonOrObj)
          : userPreferencesJsonOrObj;

      if (typeof prefs.isSundayStart === 'boolean') {
        this.isSundayStart = prefs.isSundayStart;
      }
      if (typeof prefs.defaultPriority === 'number') {
        this.defaultPriority = prefs.defaultPriority;
      }
      if (typeof prefs.compactCards === 'boolean') {
        this.compactCards = prefs.compactCards;
      }
      if (typeof prefs.desktopNotifications === 'boolean') {
        this.desktopNotifications = prefs.desktopNotifications;
      }
    } catch (e) {
      console.warn('[PrefRepository] Failed to sync preferences from user profile:', e);
    }
  }

  public exportToUserProfile(): string {
    return JSON.stringify({
      isSundayStart: this.isSundayStart,
      defaultPriority: this.defaultPriority,
      compactCards: this.compactCards,
      desktopNotifications: this.desktopNotifications,
    });
  }
}

/**
 * 🌟 싱글톤 인스턴스 export
 */
export const prefRepository = PrefRepository.getInstance();

// 짧은 별칭 지원 (prefRepo)
export const prefRepo = prefRepository;
