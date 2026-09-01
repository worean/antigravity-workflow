/**
 * 🏷️ 태그 고유 색상 팔레트 (해시 기반 자동 색상 부여)
 */
const TAG_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#84cc16', // Lime
];

export const getTagColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
};

/**
 * 🔍 문자열 또는 배열에서 해시태그 목록 추출
 * 예: "#태그 #태그1 버그수정 #긴급" -> ["태그", "태그1", "긴급"]
 */
export const extractTags = (input: string | string[] | undefined | null): string[] => {
  if (!input) return [];

  const rawList: string[] = [];

  if (Array.isArray(input)) {
    input.forEach((item) => {
      if (typeof item === 'string') {
        const matches = item.match(/(?:^|\s)#([a-zA-Z0-9가-힣_\.\-]+)/g);
        if (matches) {
          matches.forEach((m) => {
            const cleaned = m.trim().replace(/^#/, '').replace(/\.+$/, '');
            if (cleaned) rawList.push(cleaned);
          });
        } else if (item.trim()) {
          const cleaned = item.trim().replace(/^#/, '').replace(/\.+$/, '');
          if (cleaned) rawList.push(cleaned);
        }
      }
    });
  } else if (typeof input === 'string') {
    const matches = input.match(/(?:^|\s)#([a-zA-Z0-9가-힣_\.\-]+)/g);
    if (matches) {
      matches.forEach((m) => {
        const cleaned = m.trim().replace(/^#/, '').replace(/\.+$/, '');
        if (cleaned) rawList.push(cleaned);
      });
    } else {
      // 띄어쓰기 또는 쉼표로 구분된 일반 단어 목록 처리
      input.split(/[,\s]+/).forEach((word) => {
        const cleaned = word.trim().replace(/^#/, '').replace(/\.+$/, '');
        if (cleaned) rawList.push(cleaned);
      });
    }
  }

  // 중복 제거 및 공백 정리
  return Array.from(new Set(rawList.map((t) => t.trim()).filter((t) => t.length > 0)));
};
