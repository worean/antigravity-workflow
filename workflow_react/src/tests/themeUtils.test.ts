import { describe, it, expect, beforeAll } from 'vitest';
import {
  getEffectiveTheme,
  applyTheme,
  initTheme,
  getCssVar,
  setCssVar,
} from '../utils/themeUtils';

describe('themeUtils', () => {
  beforeAll(() => {
    const cssVars = new Map<string, string>();
    const attributes = new Map<string, string>();

    (globalThis as any).window = {
      matchMedia: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
    };

    (globalThis as any).document = {
      documentElement: {
        setAttribute: (k: string, v: string) => attributes.set(k, v),
        getAttribute: (k: string) => attributes.get(k) || null,
        style: {
          setProperty: (k: string, v: string) => cssVars.set(k, v),
          getPropertyValue: (k: string) => cssVars.get(k) || '',
          colorScheme: '',
        },
      },
    };

    (globalThis as any).getComputedStyle = () => ({
      getPropertyValue: (k: string) => cssVars.get(k) || '',
    });
  });

  describe('getEffectiveTheme', () => {
    it('명시적 dark 및 light 모드는 그대로 반환해야 한다', () => {
      expect(getEffectiveTheme('dark')).toBe('dark');
      expect(getEffectiveTheme('light')).toBe('light');
    });

    it('system 모드는 dark 또는 light 중 하나로 해석되어야 한다', () => {
      const eff = getEffectiveTheme('system');
      expect(['dark', 'light']).toContain(eff);
    });
  });

  describe('applyTheme & initTheme', () => {
    it('테마 적용 시 document.documentElement에 data-theme 속성이 주입되어야 한다', () => {
      const applied = applyTheme('dark');
      expect(applied).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      const appliedLight = applyTheme('light');
      expect(appliedLight).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('initTheme은 지정된 기본 테마를 성공적으로 적용해야 한다', () => {
      const res = initTheme('dark');
      expect(res).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('getCssVar & setCssVar', () => {
    it('setCssVar로 설정한 CSS 변수를 올바르게 읽을 수 있어야 한다', () => {
      setCssVar('--test-brand-color', '#38bdf8');
      const val = getCssVar('--test-brand-color');
      expect(val).toBe('#38bdf8');
    });

    it('-- 접두사가 생략되어도 자동으로 붙여서 처리해야 한다', () => {
      setCssVar('test-accent-color', '#f43f5e');
      const val = getCssVar('test-accent-color');
      expect(val).toBe('#f43f5e');
    });

    it('미정의된 CSS 변수 조회 시 fallback 값을 반환해야 한다', () => {
      const val = getCssVar('--non-existent-var', '#1e293b');
      expect(val).toBe('#1e293b');
    });
  });
});
