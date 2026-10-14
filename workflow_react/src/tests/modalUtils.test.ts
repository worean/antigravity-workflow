﻿import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  modalRegistry,
  resolvePortalContainer,
  MODAL_Z_INDEX,
} from '../utils/modalUtils';

describe('modalUtils', () => {
  beforeAll(() => {
    const elements = new Map<string, any>();

    (globalThis as any).document = {
      body: {
        style: { overflow: '' },
        appendChild: (el: any) => {
          if (el.id) elements.set(el.id, el);
        },
      },
      getElementById: (id: string) => elements.get(id) || null,
      createElement: (tag: string) => ({
        tagName: tag.toUpperCase(),
        id: '',
        style: {},
      }),
    };
  });

  beforeEach(() => {
    modalRegistry.reset();
  });

  describe('modalRegistry', () => {
    it('모달 등록 시 스택 깊이에 따라 계층 z-index가 자동으로 증가해야 한다', () => {
      const z1 = modalRegistry.register('modal-1');
      expect(z1).toBe(MODAL_Z_INDEX.MODAL_BASE + MODAL_Z_INDEX.MODAL_STEP);
      expect(modalRegistry.getTopModalId()).toBe('modal-1');

      const z2 = modalRegistry.register('modal-2');
      expect(z2).toBeGreaterThan(z1);
      expect(modalRegistry.getTopModalId()).toBe('modal-2');
      expect(modalRegistry.getOpenModalCount()).toBe(2);
    });

    it('확인(Confirm) 모달은 CONFIRM_ALERT_BASE를 기준으로 더 높은 z-index를 받아야 한다', () => {
      modalRegistry.register('normal-modal');
      const confirmZ = modalRegistry.register('confirm-modal', { isConfirm: true });

      expect(confirmZ).toBeGreaterThanOrEqual(MODAL_Z_INDEX.CONFIRM_ALERT_BASE);
      expect(modalRegistry.getTopModalId()).toBe('confirm-modal');
    });

    it('모달 해제(unregister) 시 최상위 모달 ID가 이전 모달로 갱신되어야 한다', () => {
      modalRegistry.register('modal-a');
      modalRegistry.register('modal-b');

      expect(modalRegistry.getTopModalId()).toBe('modal-b');

      modalRegistry.unregister('modal-b');
      expect(modalRegistry.getTopModalId()).toBe('modal-a');
      expect(modalRegistry.getOpenModalCount()).toBe(1);

      modalRegistry.unregister('modal-a');
      expect(modalRegistry.getTopModalId()).toBeNull();
      expect(modalRegistry.getOpenModalCount()).toBe(0);
    });
  });

  describe('resolvePortalContainer', () => {
    it('기본 ID 또는 특정 컨테이너를 안전하게 탐색/생성하여 반환해야 한다', () => {
      const container = resolvePortalContainer(null, 'test-portal-root');
      expect(container).toBeDefined();
      expect(container.id).toBe('test-portal-root');
    });
  });
});
