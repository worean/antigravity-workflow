/**
 * AntiGravity Unified Modal & Layering Utilities
 * - 다중 모달 계층(z-index) 자동 계산 및 스택 레지스트리 (최상위 모달 추적)
 * - 모달이 특정 컴포넌트/엘리먼트 위에 오버레이되도록 하는 타겟 컨테이너 리졸버
 * - 다중 모달 환경을 지원하는 안전한 바디 스크롤 락 관리자
 */

export const MODAL_Z_INDEX = {
  MODAL_BASE: 1000,
  MODAL_STEP: 10,
  DRAWER_BASE: 1100,
  CONFIRM_ALERT_BASE: 2000,
  TOAST_BASE: 9999,
} as const;

export interface ModalRegistrationOptions {
  baseZIndex?: number;
  isConfirm?: boolean;
}

class ModalStackRegistry {
  private stack: string[] = [];
  private zIndexMap: Map<string, number> = new Map();
  private scrollLockCount: number = 0;
  private prevBodyOverflow: string = '';

  /**
   * 모달을 스택에 등록하고, 계층 순서에 따른 고유 z-index를 반환합니다.
   */
  public register(modalId: string, options: ModalRegistrationOptions = {}): number {
    // 이미 등록되어 있다면 스택 최상단으로 이동
    const existingIdx = this.stack.indexOf(modalId);
    if (existingIdx !== -1) {
      this.stack.splice(existingIdx, 1);
    }

    this.stack.push(modalId);

    const base = options.isConfirm
      ? MODAL_Z_INDEX.CONFIRM_ALERT_BASE
      : (options.baseZIndex ?? MODAL_Z_INDEX.MODAL_BASE);

    // 스택 깊이에 따라 z-index 자동 계산
    const calculatedZIndex = base + this.stack.length * MODAL_Z_INDEX.MODAL_STEP;
    this.zIndexMap.set(modalId, calculatedZIndex);

    this.lockScroll();

    return calculatedZIndex;
  }

  /**
   * 모달을 스택에서 제거합니다.
   */
  public unregister(modalId: string): void {
    const idx = this.stack.indexOf(modalId);
    if (idx !== -1) {
      this.stack.splice(idx, 1);
      this.zIndexMap.delete(modalId);
      this.unlockScroll();
    }
  }

  /**
   * 현재 가장 상위에 떠 있는 최상위 모달 ID를 반환합니다.
   */
  public getTopModalId(): string | null {
    if (this.stack.length === 0) return null;
    return this.stack[this.stack.length - 1];
  }

  /**
   * 특정 모달의 계산된 z-index를 반환합니다.
   */
  public getZIndex(modalId: string, fallbackBase: number = MODAL_Z_INDEX.MODAL_BASE): number {
    return this.zIndexMap.get(modalId) ?? fallbackBase;
  }

  /**
   * 현재 열려 있는 활성 모달 개수를 반환합니다.
   */
  public getOpenModalCount(): number {
    return this.stack.length;
  }

  /**
   * 다중 모달 환경에 안전한 배경 스크롤 락
   */
  public lockScroll(): void {
    if (typeof document === 'undefined') return;
    if (this.scrollLockCount === 0) {
      this.prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    this.scrollLockCount++;
  }

  public unlockScroll(): void {
    if (typeof document === 'undefined') return;
    this.scrollLockCount = Math.max(0, this.scrollLockCount - 1);
    if (this.scrollLockCount === 0) {
      document.body.style.overflow = this.prevBodyOverflow;
    }
  }

  /**
   * 스택을 강제 리셋합니다. (테스트 또는 로그아웃 시)
   */
  public reset(): void {
    this.stack = [];
    this.zIndexMap.clear();
    if (typeof document !== 'undefined' && this.scrollLockCount > 0) {
      document.body.style.overflow = this.prevBodyOverflow;
    }
    this.scrollLockCount = 0;
  }
}

export const modalRegistry = new ModalStackRegistry();

/**
 * 모달이 마운트될 부모 DOM 컨테이너를 안전하게 탐색하거나 생성하여 반환합니다.
 * @param target 대상 컨테이너 ID(string) 또는 실제 HTMLElement 객체
 * @param fallbackContainerId 기본 생성할 컨테이너 ID (기본: 'ag-portal-root')
 */
export const resolvePortalContainer = (
  target?: string | HTMLElement | null,
  fallbackContainerId: string = 'ag-portal-root'
): HTMLElement => {
  if (typeof document === 'undefined') {
    return {} as HTMLElement;
  }

  // 1. HTMLElement 직접 전달된 경우
  if (
    typeof HTMLElement !== 'undefined'
      ? target instanceof HTMLElement
      : Boolean(target && typeof target === 'object' && (target as any).nodeType)
  ) {
    return target as HTMLElement;
  }

  // 2. target이 ID 문자열로 전달된 경우
  if (typeof target === 'string' && target.trim()) {
    const found = document.getElementById(target.trim());
    if (found) return found;
  }

  // 3. 기본 fallbackContainerId 탐색 또는 동적 생성
  let el = document.getElementById(fallbackContainerId);
  if (!el) {
    el = document.createElement('div');
    el.id = fallbackContainerId;
    document.body.appendChild(el);
  }

  return el;
};
