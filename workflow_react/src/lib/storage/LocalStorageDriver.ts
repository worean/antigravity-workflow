// -*- coding: utf-8 -*-
import type { IStorageDriver } from './IStorageDriver';

/**
 * 💾 Browser LocalStorage 구현체
 */
export class LocalStorageDriver implements IStorageDriver {
  public getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null || raw === undefined) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        // 일반 평문 문자열 fallback
        return raw as unknown as T;
      }
    } catch (e) {
      console.warn(`[LocalStorageDriver] Failed to read key "${key}":`, e);
      return null;
    }
  }

  public setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
        return;
      }
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
    } catch (e) {
      console.warn(`[LocalStorageDriver] Failed to write key "${key}":`, e);
    }
  }

  public removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[LocalStorageDriver] Failed to remove key "${key}":`, e);
    }
  }

  public clear(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.clear();
    } catch (e) {
      console.warn('[LocalStorageDriver] Failed to clear storage:', e);
    }
  }
}
