import type { ExtensionPoint, IExtension } from './types';

/**
 * 🏛️ 플러그인 확장 기능 중앙 레지스트리 (ExtensionRegistry)
 * - 각 플러그인은 특정 ExtensionPoint에 자신의 UI 확장을 등록할 수 있습니다.
 * - 코어 UI는 ExtensionSlot 컴포넌트를 통해 등록된 확장들을 선언적으로 렌더링합니다.
 */
export class ExtensionRegistry {
  private static instance: ExtensionRegistry | null = null;
  private extensions: Map<string, IExtension> = new Map();
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): ExtensionRegistry {
    if (!ExtensionRegistry.instance) {
      ExtensionRegistry.instance = new ExtensionRegistry();
    }
    return ExtensionRegistry.instance;
  }

  /**
   * 신규 UI 확장 등록
   */
  public register<TContext = any>(extension: IExtension<TContext>): void {
    if (this.extensions.has(extension.id)) {
      console.warn(`[ExtensionRegistry] Extension with ID '${extension.id}' is already registered. Overwriting.`);
    }
    this.extensions.set(extension.id, extension as IExtension);
    this.notify();
  }

  /**
   * 확장 등록 해제
   */
  public unregister(id: string): void {
    if (this.extensions.delete(id)) {
      this.notify();
    }
  }

  /**
   * 특정 확장 슬롯에 등록된 확장 목록 조회 (order 오름차순 정렬)
   */
  public getExtensions<TContext = any>(point: ExtensionPoint, context?: TContext): IExtension<TContext>[] {
    const list: IExtension<TContext>[] = [];

    for (const ext of this.extensions.values()) {
      if (ext.point !== point) continue;

      if (ext.isEnabled && context !== undefined) {
        try {
          if (!ext.isEnabled(context)) {
            continue;
          }
        } catch (err) {
          console.error(`[ExtensionRegistry] Error checking isEnabled for '${ext.id}':`, err);
          continue;
        }
      }

      list.push(ext as IExtension<TContext>);
    }

    return list.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }

  /**
   * 변경 사항 구독 (React 훅 연동용)
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[ExtensionRegistry] Listener notification error:', err);
      }
    });
  }

  /**
   * 모든 확장 초기화 (테스트용)
   */
  public clear(): void {
    this.extensions.clear();
    this.notify();
  }
}

export const extensionRegistry = ExtensionRegistry.getInstance();
