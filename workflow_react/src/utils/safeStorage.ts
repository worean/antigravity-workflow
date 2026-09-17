/**
 * safeStorage - 타입 안전하고 예외에 안전한 LocalStorage 추상화 유틸리티
 * 
 * - 네임스페이스 자동 접두사 ('ag_') 부여
 * - JSON 직렬화 및 역직렬화 예외 안전 처리 (try-catch)
 * - 브라우저/Electron 샌드박스 및 용량 초과(QuotaExceededError) 대응
 */

const STORAGE_PREFIX = 'ag_';

export const safeStorage = {
  /**
   * 키에 네임스페이스 접두사 결합
   */
  getPrefixedKey(key: string): string {
    return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
  },

  /**
   * 로컬 스토리지에서 값 조회 및 JSON 파싱
   */
  getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }

    try {
      const fullKey = this.getPrefixedKey(key);
      const raw = window.localStorage.getItem(fullKey);
      if (raw === null || raw === undefined) {
        return fallback;
      }
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[safeStorage] Failed to read key "${key}":`, err);
      return fallback;
    }
  },

  /**
   * 로컬 스토리지에 값 JSON 직렬화하여 저장
   */
  setItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    try {
      const fullKey = this.getPrefixedKey(key);
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(fullKey, serialized);
      return true;
    } catch (err) {
      console.error(`[safeStorage] Failed to write key "${key}":`, err);
      return false;
    }
  },

  /**
   * 로컬 스토리지에서 특정 키 삭제
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const fullKey = this.getPrefixedKey(key);
      window.localStorage.removeItem(fullKey);
    } catch (err) {
      console.warn(`[safeStorage] Failed to remove key "${key}":`, err);
    }
  },

  /**
   * 네임스페이스 접두사('ag_')를 가진 모든 저장 항목 초기화
   */
  clearAppStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch (err) {
      console.warn('[safeStorage] Failed to clear application storage:', err);
    }
  },
};
