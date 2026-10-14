import { useMemo, useCallback } from 'react';
import { usePrefStore } from '@/stores/usePrefStore';
import { getEffectiveTheme, type ThemeMode } from '@/utils/themeUtils';

export interface UseThemeReturn {
  /** 현재 사용자 설정 테마 ('dark' | 'light' | 'system') */
  theme: ThemeMode;
  /** OS 시스템 설정까지 반영된 실제 렌더링 테마 ('dark' | 'light') */
  resolvedTheme: 'dark' | 'light';
  /** 다크 모드 활성화 여부 */
  isDark: boolean;
  /** 테마 변경 세터 */
  setTheme: (theme: ThemeMode) => void;
  /** 다크 <-> 라이트 빠른 전환 토글러 */
  toggleTheme: () => void;
}

export const useTheme = (): UseThemeReturn => {
  const theme = usePrefStore((s) => s.theme);
  const setTheme = usePrefStore((s) => s.setTheme);

  const resolvedTheme = useMemo(() => getEffectiveTheme(theme), [theme]);
  const isDark = resolvedTheme === 'dark';

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    isDark,
    setTheme,
    toggleTheme,
  };
};
