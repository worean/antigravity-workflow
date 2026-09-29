export type ThemeMode = 'dark' | 'light' | 'system';

let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;
let mediaQueryList: MediaQueryList | null = null;

/**
 * OS 시스템의 다크 모드 선호 여부를 확인합니다.
 */
export const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * 테마 설정을 DOM(document.documentElement)에 반영합니다.
 * @param themeMode 'dark' | 'light' | 'system'
 * @returns 실제로 적용된 테마 ('dark' | 'light')
 */
export const applyTheme = (themeMode: ThemeMode): 'dark' | 'light' => {
  if (typeof document === 'undefined') return 'dark';

  const resolvedTheme: 'dark' | 'light' = themeMode === 'system' ? getSystemTheme() : themeMode;

  const root = document.documentElement;
  root.setAttribute('data-theme', resolvedTheme);
  root.style.colorScheme = resolvedTheme;

  // OS 시스템 테마 변경 감지 리스너 관리
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (systemThemeListener && mediaQueryList) {
      mediaQueryList.removeEventListener('change', systemThemeListener);
      systemThemeListener = null;
      mediaQueryList = null;
    }

    if (themeMode === 'system') {
      mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      systemThemeListener = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? 'dark' : 'light';
        root.setAttribute('data-theme', newResolved);
        root.style.colorScheme = newResolved;
      };
      mediaQueryList.addEventListener('change', systemThemeListener);
    }
  }

  return resolvedTheme;
};

/**
 * 앱 최초 로드 시 테마를 즉각 적용합니다.
 */
export const initTheme = (initialTheme: ThemeMode = 'dark'): 'dark' | 'light' => {
  return applyTheme(initialTheme);
};
