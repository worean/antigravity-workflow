/**
 * WCAG 2.1 Web Content Accessibility Guidelines 기반
 * 색상 상대 휘도(Relative Luminance) 및 최적 텍스트 명암비(Contrast Ratio) 계산 유틸리티
 */

export interface ContrastTextResult {
  /** 최적 텍스트 전경색 (#ffffff, #0f172a, #1e293b 등) */
  color: string;
  /** 배경과의 경계를 더욱 또렷하게 해주는 미세 텍스트 그림자 */
  textShadow: string;
  /** 계산된 상대 휘도 (0.0 ~ 1.0) */
  luminance: number;
  /** 명암 톤 ('light' | 'medium' | 'dark') */
  tone: 'light' | 'medium' | 'dark';
}

/**
 * HEX / RGB / RGBA 색상 문자열을 { r, g, b, a } 수치로 정규화 파싱
 */
export const parseColorToRgb = (
  colorStr?: string | null
): { r: number; g: number; b: number; a: number } => {
  if (!colorStr) return { r: 0, g: 0, b: 0, a: 1 };
  const str = colorStr.trim().toLowerCase();

  // 1. HEX (#RGB, #RRGGBB, #RRGGBBAA)
  if (str.startsWith('#')) {
    let hex = str.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex.slice(0, 6), 16) || 0;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    let a = 1;
    if (hex.length === 8) {
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
    return { r, g, b, a };
  }

  // 2. RGB / RGBA
  if (str.startsWith('rgb')) {
    const parts = str.match(/[\d.]+/g);
    if (parts && parts.length >= 3) {
      const r = Math.min(255, Math.max(0, parseFloat(parts[0])));
      const g = Math.min(255, Math.max(0, parseFloat(parts[1])));
      const b = Math.min(255, Math.max(0, parseFloat(parts[2])));
      const a = parts.length >= 4 ? Math.min(1, Math.max(0, parseFloat(parts[3]))) : 1;
      return { r, g, b, a };
    }
  }

  return { r: 0, g: 0, b: 0, a: 1 };
};

/**
 * WCAG 2.1 상대 휘도(Relative Luminance) 계산 (0.0: 순수 검정 ~ 1.0: 순수 흰색)
 */
export const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const c = val / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
};

/**
 * 두 휘도 사이의 WCAG 명암 대비율(Contrast Ratio, 1.0:1 ~ 21.0:1) 계산
 */
export const getContrastRatio = (lum1: number, lum2: number): number => {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * 배경 색상에 따라 가장 가독성이 높은 텍스트 색상(화이트/그레이/블랙) 및 그림자 스타일 계산
 * @param bgColor 배경 색상 (HEX, RGB, RGBA)
 * @param backdropColor 반투명 배경일 때 밑에 깔리는 베이스 색상 (기본: 다크 모드 카드 배경 '#1e1e1e')
 */
export const getOptimalContrastText = (
  bgColor: string,
  backdropColor: string = '#1e1e1e'
): ContrastTextResult => {
  const parsed = parseColorToRgb(bgColor);
  let effectiveR = parsed.r;
  let effectiveG = parsed.g;
  let effectiveB = parsed.b;

  // 알파(투명도)가 1 미만인 경우 백드롭 배경과 알파 블렌딩 합성
  if (parsed.a < 1) {
    const bgBase = parseColorToRgb(backdropColor);
    effectiveR = Math.round(parsed.r * parsed.a + bgBase.r * (1 - parsed.a));
    effectiveG = Math.round(parsed.g * parsed.a + bgBase.g * (1 - parsed.a));
    effectiveB = Math.round(parsed.b * parsed.a + bgBase.b * (1 - parsed.a));
  }

  const lum = getRelativeLuminance(effectiveR, effectiveG, effectiveB);

  // WCAG 명암비 계산 (순백색: lum=1.0, 짙은차콜: lum=0.015)
  const contrastWithWhite = getContrastRatio(lum, 1.0);
  const contrastWithBlack = getContrastRatio(lum, 0.015);

  // 1. 배경이 매우 밝음 (lum >= 0.52 또는 블랙 대비비가 4.5 이상으로 압도적) -> 짙은 블랙/차콜
  if (lum >= 0.52 || (contrastWithBlack >= 4.5 && contrastWithBlack > contrastWithWhite * 1.3)) {
    return {
      color: '#0f172a',
      textShadow: '0 1px 2px rgba(255, 255, 255, 0.55)',
      luminance: lum,
      tone: 'light',
    };
  }

  // 2. 중간 톤의 애매한 배경 (0.35 <= lum < 0.52)
  if (lum >= 0.35) {
    if (contrastWithBlack >= contrastWithWhite) {
      return {
        color: '#1e293b',
        textShadow: '0 1px 2px rgba(255, 255, 255, 0.45)',
        luminance: lum,
        tone: 'medium',
      };
    } else {
      return {
        color: '#f8fafc',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.85)',
        luminance: lum,
        tone: 'medium',
      };
    }
  }

  // 3. 어두운 배경 (lum < 0.35) -> 선명한 순백색
  return {
    color: '#ffffff',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)',
    luminance: lum,
    tone: 'dark',
  };
};

/**
 * 16진수 HEX 색상 코드(#RGB, #RRGGBB, #RRGGBBAA)의 유효성을 검증합니다.
 */
export const isValidHex = (hex?: string | null): boolean => {
  if (!hex) return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex.trim());
};

/**
 * r, g, b 수치를 #RRGGBB 형식의 HEX 문자열로 변환합니다.
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val)));
  const toHex = (c: number) => clamp(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * HEX 색상을 rgba(r, g, b, alpha) 문자열로 변환합니다.
 */
export const hexToRgba = (hexStr: string, alpha: number = 1): string => {
  const { r, g, b } = parseColorToRgb(hexStr);
  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
};

/**
 * HEX 색상의 밝기를 퍼센트(-100 ~ 100) 단위로 조절합니다.
 */
export const adjustColorBrightness = (hexStr: string, percent: number): string => {
  const { r, g, b } = parseColorToRgb(hexStr);
  const factor = percent / 100;

  const newR = percent > 0 ? r + (255 - r) * factor : r * (1 + factor);
  const newG = percent > 0 ? g + (255 - g) * factor : g * (1 + factor);
  const newB = percent > 0 ? b + (255 - b) * factor : b * (1 + factor);

  return rgbToHex(newR, newG, newB);
};

/**
 * 프로젝트, 태그, 상태, 일정 등에서 바로 사용할 수 있는 표준 테마 컬러 팔레트 프리셋
 */
export const PALETTE_PRESETS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#64748b', // Slate
] as const;
