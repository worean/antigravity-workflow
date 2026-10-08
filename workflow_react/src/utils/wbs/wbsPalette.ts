import type { WBSColorTheme } from '@/types/wbs';

// 12가지 다채로운 WBS/간트차트 전용 색상 팔레트
export const WBS_PALETTE: WBSColorTheme[] = [
  {
    name: 'blue',
    base: '#007acc',
    border: '#1f8ad2',
    progress: '#38bdf8',
    bgEmpty: 'rgba(0, 122, 204, 0.18)',
    parentBase: '#007acc',
    parentBorder: '#38bdf8',
    dragBase: '#0284c7',
    dragBorder: '#7dd3fc',
  },
  {
    name: 'emerald',
    base: '#059669',
    border: '#10b981',
    progress: '#34d399',
    bgEmpty: 'rgba(5, 150, 105, 0.18)',
    parentBase: '#059669',
    parentBorder: '#34d399',
    dragBase: '#047857',
    dragBorder: '#6ee7b7',
  },
  {
    name: 'indigo',
    base: '#4f46e5',
    border: '#6366f1',
    progress: '#818cf8',
    bgEmpty: 'rgba(79, 70, 229, 0.18)',
    parentBase: '#4f46e5',
    parentBorder: '#818cf8',
    dragBase: '#4338ca',
    dragBorder: '#a5b4fc',
  },
  {
    name: 'purple',
    base: '#7c3aed',
    border: '#8b5cf6',
    progress: '#a78bfa',
    bgEmpty: 'rgba(124, 58, 237, 0.18)',
    parentBase: '#7c3aed',
    parentBorder: '#a78bfa',
    dragBase: '#6d28d9',
    dragBorder: '#c4b5fd',
  },
  {
    name: 'amber',
    base: '#d97706',
    border: '#f59e0b',
    progress: '#fbbf24',
    bgEmpty: 'rgba(217, 119, 6, 0.18)',
    parentBase: '#d97706',
    parentBorder: '#fbbf24',
    dragBase: '#b45309',
    dragBorder: '#fde68a',
  },
  {
    name: 'cyan',
    base: '#0891b2',
    border: '#06b6d4',
    progress: '#22d3ee',
    bgEmpty: 'rgba(8, 145, 178, 0.18)',
    parentBase: '#0891b2',
    parentBorder: '#22d3ee',
    dragBase: '#0e7490',
    dragBorder: '#67e8f9',
  },
  {
    name: 'rose',
    base: '#e11d48',
    border: '#f43f5e',
    progress: '#fb7185',
    bgEmpty: 'rgba(225, 29, 72, 0.18)',
    parentBase: '#e11d48',
    parentBorder: '#fb7185',
    dragBase: '#be123c',
    dragBorder: '#fda4af',
  },
  {
    name: 'green',
    base: '#16a34a',
    border: '#22c55e',
    progress: '#4ade80',
    bgEmpty: 'rgba(22, 163, 74, 0.18)',
    parentBase: '#16a34a',
    parentBorder: '#4ade80',
    dragBase: '#15803d',
    dragBorder: '#86efac',
  },
  {
    name: 'orange',
    base: '#ea580c',
    border: '#f97316',
    progress: '#fb923c',
    bgEmpty: 'rgba(234, 88, 12, 0.18)',
    parentBase: '#ea580c',
    parentBorder: '#fb923c',
    dragBase: '#c2410c',
    dragBorder: '#fdba74',
  },
  {
    name: 'fuchsia',
    base: '#c026d3',
    border: '#d946ef',
    progress: '#e879f9',
    bgEmpty: 'rgba(192, 38, 211, 0.18)',
    parentBase: '#c026d3',
    parentBorder: '#e879f9',
    dragBase: '#a21caf',
    dragBorder: '#f0abfc',
  },
  {
    name: 'teal',
    base: '#0d9488',
    border: '#14b8a6',
    progress: '#2dd4bf',
    bgEmpty: 'rgba(13, 148, 136, 0.18)',
    parentBase: '#0d9488',
    parentBorder: '#2dd4bf',
    dragBase: '#0f766e',
    dragBorder: '#5eead4',
  },
  {
    name: 'violet',
    base: '#6d28d9',
    border: '#7c3aed',
    progress: '#8b5cf6',
    bgEmpty: 'rgba(109, 40, 217, 0.18)',
    parentBase: '#6d28d9',
    parentBorder: '#8b5cf6',
    dragBase: '#5b21b6',
    dragBorder: '#a78bfa',
  },
];

/**
 * 고정된 Seed 기반 의사 난수 해시 함수
 * 최상위 이슈 ID(rootId)에 따라 항상 일관되고 고정된 색상 테마를 반환합니다.
 */
export const getWBSColorByRootId = (rootId: number): WBSColorTheme => {
  const hash = Math.abs((rootId * 2654435761) ^ (rootId >> 16));
  const index = hash % WBS_PALETTE.length;
  return WBS_PALETTE[index];
};

/**
 * 팔레트 이름으로 WBSColorTheme 검색
 */
export const getWBSPaletteByName = (name: string): WBSColorTheme | undefined => {
  return WBS_PALETTE.find((p) => p.name.toLowerCase() === name.toLowerCase());
};

/**
 * 임의의 HEX 컬러로부터 WBSColorTheme을 생성
 */
export const createWBSColorThemeFromHex = (baseHex: string, name = 'custom'): WBSColorTheme => {
  let hex = baseHex.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;

  // HEX가 3자리인 경우 6자리로 확장
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  // 16진수 파싱
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;

  // 밝은 강조색(progress / border) 생성
  const lighten = (val: number, amount: number) => Math.min(255, Math.round(val + (255 - val) * amount));
  const darken = (val: number, amount: number) => Math.max(0, Math.round(val * (1 - amount)));

  const borderHex = `rgb(${lighten(r, 0.2)}, ${lighten(g, 0.2)}, ${lighten(b, 0.2)})`;
  const progressHex = `rgb(${lighten(r, 0.35)}, ${lighten(g, 0.35)}, ${lighten(b, 0.35)})`;
  const dragBaseHex = `rgb(${darken(r, 0.1)}, ${darken(g, 0.1)}, ${darken(b, 0.1)})`;
  const dragBorderHex = `rgb(${lighten(r, 0.4)}, ${lighten(g, 0.4)}, ${lighten(b, 0.4)})`;

  return {
    name,
    base: hex,
    border: borderHex,
    progress: progressHex,
    bgEmpty: `rgba(${r}, ${g}, ${b}, 0.18)`,
    parentBase: hex,
    parentBorder: progressHex,
    dragBase: dragBaseHex,
    dragBorder: dragBorderHex,
  };
};

/**
 * 이름 또는 HEX 문자열을 받아 최적의 WBSColorTheme 결정
 */
export const resolveWBSColorTheme = (colorOrName?: string | null, fallbackRootId?: number): WBSColorTheme => {
  if (colorOrName) {
    const preset = getWBSPaletteByName(colorOrName);
    if (preset) return preset;
    if (colorOrName.startsWith('#') || colorOrName.startsWith('rgb')) {
      return createWBSColorThemeFromHex(colorOrName);
    }
  }

  if (fallbackRootId !== undefined && fallbackRootId !== null) {
    return getWBSColorByRootId(fallbackRootId);
  }

  return WBS_PALETTE[0];
};
