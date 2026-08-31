// -*- coding: utf-8 -*-
/**
 * 📦 스토리지 엔진 추상화 인터페이스 (Storage Driver Interface)
 */
export interface IStorageDriver {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}
