// -*- coding: utf-8 -*-
import type { IStorageDriver } from './IStorageDriver';
import { LocalStorageDriver } from './LocalStorageDriver';
import type {
  AppPreferenceSchema,
  IPreferenceRepository,
} from './IPreferenceRepository';
import type { User } from '@/types';

/**
 * 🌟 기본 설정값 (Default Fallback Preferences)
 */
export const DEFAULT_APP_PREFERENCES: AppPreferenceSchema = {
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
 * 🏛️ PreferenceRepository (설정 저장소 리포지토리 구현체)
 */
export class PreferenceRepository implements IPreferenceRepository {
  private static instance: PreferenceRepository;
  private readonly driver: IStorageDriver;

  // 스토리지 키 매핑
  private readonly keyMap: Record<keyof AppPreferenceSchema, string> = {
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

  constructor(driver: IStorageDriver = new LocalStorageDriver()) {
    this.driver = driver;
  }

  public static getInstance(driver?: IStorageDriver): PreferenceRepository {
    if (!PreferenceRepository.instance) {
      PreferenceRepository.instance = new PreferenceRepository(driver);
    }
    return PreferenceRepository.instance;
  }

  // --- Generic Get / Set ---
  public get<K extends keyof AppPreferenceSchema>(key: K): AppPreferenceSchema[K] {
    const storageKey = this.keyMap[key];
    const val = this.driver.getItem<any>(storageKey);

    if (val === null || val === undefined) {
      return DEFAULT_APP_PREFERENCES[key];
    }

    // 타입별 안전 정규화
    if (typeof DEFAULT_APP_PREFERENCES[key] === 'boolean') {
      return (val === true || val === 'true') as AppPreferenceSchema[K];
    }
    if (typeof DEFAULT_APP_PREFERENCES[key] === 'number') {
      const num = Number(val);
      return (isNaN(num) ? DEFAULT_APP_PREFERENCES[key] : num) as AppPreferenceSchema[K];
    }

    return val as AppPreferenceSchema[K];
  }

  public set<K extends keyof AppPreferenceSchema>(key: K, value: AppPreferenceSchema[K]): void {
    const storageKey = this.keyMap[key];
    this.driver.setItem(storageKey, value);
  }

  // --- Getters / Setters ---
  public get isSundayStart(): boolean {
    return this.get('isSundayStart');
  }
  public set isSundayStart(value: boolean) {
    this.set('isSundayStart', value);
  }

  public get defaultPriority(): number {
    return this.get('defaultPriority');
  }
  public set defaultPriority(value: number) {
    this.set('defaultPriority', value);
  }

  public get compactCards(): boolean {
    return this.get('compactCards');
  }
  public set compactCards(value: boolean) {
    this.set('compactCards', value);
  }

  public get desktopNotifications(): boolean {
    return this.get('desktopNotifications');
  }
  public set desktopNotifications(value: boolean) {
    this.set('desktopNotifications', value);
  }

  public get backendApiUrl(): string {
    return this.get('backendApiUrl');
  }
  public set backendApiUrl(value: string) {
    this.set('backendApiUrl', value);
  }

  public get activeWorkspaceId(): number | null {
    const val = this.driver.getItem<any>(this.keyMap.activeWorkspaceId);
    if (!val) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }
  public set activeWorkspaceId(value: number | null) {
    if (value === null) {
      this.driver.removeItem(this.keyMap.activeWorkspaceId);
    } else {
      this.driver.setItem(this.keyMap.activeWorkspaceId, String(value));
    }
  }

  public get activeTab(): string {
    return this.get('activeTab');
  }
  public set activeTab(value: string) {
    this.set('activeTab', value);
  }

  public get selectedProjectId(): number | null {
    const val = this.driver.getItem<any>(this.keyMap.selectedProjectId);
    if (!val) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }
  public set selectedProjectId(value: number | null) {
    if (value === null) {
      this.driver.removeItem(this.keyMap.selectedProjectId);
    } else {
      this.driver.setItem(this.keyMap.selectedProjectId, String(value));
    }
  }

  // --- Auth & Session Storage ---
  public get authToken(): string | null {
    return this.driver.getItem<string>(this.AUTH_TOKEN_KEY);
  }
  public set authToken(token: string | null) {
    if (token) {
      this.driver.setItem(this.AUTH_TOKEN_KEY, token);
    } else {
      this.driver.removeItem(this.AUTH_TOKEN_KEY);
    }
  }

  public get currentUser(): User | null {
    return this.driver.getItem<User>(this.USER_KEY);
  }
  public set currentUser(user: User | null) {
    if (user) {
      this.driver.setItem(this.USER_KEY, user);
    } else {
      this.driver.removeItem(this.USER_KEY);
    }
  }

  public clearAuth(): void {
    this.driver.removeItem(this.AUTH_TOKEN_KEY);
    this.driver.removeItem(this.USER_KEY);
  }

  // --- Bulk Methods ---
  public getAll(): AppPreferenceSchema {
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

  public update(partial: Partial<AppPreferenceSchema>): void {
    Object.entries(partial).forEach(([key, value]) => {
      if (key in this.keyMap && value !== undefined) {
        this.set(key as keyof AppPreferenceSchema, value as any);
      }
    });
  }

  public resetToDefaults(): void {
    this.update(DEFAULT_APP_PREFERENCES);
  }

  // --- Sync with Backend Profile ---
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
      console.warn('[PreferenceRepository] Failed to sync preferences from user profile:', e);
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
 * 🌟 전역 싱글톤 인스턴스 export
 */
export const preferenceRepository = PreferenceRepository.getInstance();
