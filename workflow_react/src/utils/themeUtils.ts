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
 * 현재 테마 모드가 시스템일 경우 OS 설정까지 감안한 실제 적용 테마('dark' | 'light')를 반환합니다.
 */
export const getEffectiveTheme = (themeMode: ThemeMode): 'dark' | 'light' => {
  return themeMode === 'system' ? getSystemTheme() : themeMode;
};

/**
 * 앱 최초 로드 시 테마를 즉각 적용합니다.
 */
export const initTheme = (initialTheme: ThemeMode = 'dark'): 'dark' | 'light' => {
  return applyTheme(initialTheme);
};

/**
 * DOM의 root(document.documentElement)로부터 계산된 CSS 변수 값을 조회합니다.
 * @param varName CSS 변수명 (예: '--primary', '--bg-card')
 * @param fallback 변수 미정의 시 대체할 기본값
 */
export const getCssVar = (varName: string, fallback: string = ''): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const name = varName.startsWith('--') ? varName : `--${varName}`;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
};

/**
 * DOM의 root(document.documentElement)에 CSS 변수 값을 동적으로 설정합니다.
 */
export const setCssVar = (varName: string, value: string): void => {
  if (typeof document === 'undefined') return;
  const name = varName.startsWith('--') ? varName : `--${varName}`;
  document.documentElement.style.setProperty(name, value);
};
