// -*- coding: utf-8 -*-
import type { User } from '@/types';

/**
 * 🛠️ 앱 환경설정 데이터 스키마
 */
export interface AppPreferenceSchema {
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
 * 🔐 인증 및 세션 저장소 스키마
 */
export interface AuthStorageSchema {
  authToken: string | null;
  user: User | null;
}

/**
 * 🏛️ 설정 리포지토리 인터페이스 (Repository Pattern)
 */
export interface IPreferenceRepository {
  // 개별 프로퍼티 Getters / Setters
  isSundayStart: boolean;
  defaultPriority: number;
  compactCards: boolean;
  desktopNotifications: boolean;
  backendApiUrl: string;
  activeWorkspaceId: number | null;
  activeTab: string;
  selectedProjectId: number | null;

  // 인증 토큰 및 세션 정보
  authToken: string | null;
  currentUser: User | null;

  // 범용 Get / Set 메서드
  get<K extends keyof AppPreferenceSchema>(key: K): AppPreferenceSchema[K];
  set<K extends keyof AppPreferenceSchema>(key: K, value: AppPreferenceSchema[K]): void;

  // 전체 설정 객체 조회 및 일괄 업데이트
  getAll(): AppPreferenceSchema;
  update(partial: Partial<AppPreferenceSchema>): void;
  resetToDefaults(): void;

  // 백엔드 사용자 프로필과 양방향 자동 동기화
  syncFromUserProfile(userPreferencesJsonOrObj: string | object | null | undefined): void;
  exportToUserProfile(): string;

  // 세션 정리
  clearAuth(): void;
}
