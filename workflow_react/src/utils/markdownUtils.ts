/**
 * AntiGravity Unified Markdown Utilities
 * - 마크다운 문법 감싸기/접두사 삽입 헬퍼
 * - 스마트 에디터 키보드 이벤트 핸들러 (Tab 들여쓰기, Shift+Tab 내어쓰기, Enter 자동 리스트 연장)
 * - 순수 텍스트 추출(Strip) 및 읽기 소요 시간 계산
 */

export interface MarkdownInsertResult {
  newValue: string;
  newSelectionStart: number;
  newSelectionEnd: number;
}

/**
 * 선택된 텍스트 앞뒤로 마크다운 문법을 감싸거나 접두사를 삽입합니다.
 */
export const applyMarkdownSyntax = (
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string = '',
  defaultText: string = ''
): MarkdownInsertResult => {
  const selectedText = text.substring(selectionStart, selectionEnd) || defaultText;
  const replacement = `${prefix}${selectedText}${suffix}`;
  const newValue = text.substring(0, selectionStart) + replacement + text.substring(selectionEnd);

  return {
    newValue,
    newSelectionStart: selectionStart + prefix.length,
    newSelectionEnd: selectionStart + prefix.length + selectedText.length,
  };
};

/**
 * 키보드 입력(Tab, Shift+Tab, Enter) 시 스마트 들여쓰기/내어쓰기 및 자동 목록 연장 연산을 수행합니다.
 */
export const handleMarkdownKeyAction = (
  key: string,
  shiftKey: boolean,
  text: string,
  selectionStart: number,
  selectionEnd: number
): MarkdownInsertResult | null => {
  // 1. Tab / Shift+Tab 들여쓰기 & 내어쓰기 (2스페이스 기준)
  if (key === 'Tab') {
    const tabStr = '  ';

    if (shiftKey) {
      // 내어쓰기
      const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
      if (text.substring(lineStart, lineStart + 2) === tabStr) {
        const newValue = text.substring(0, lineStart) + text.substring(lineStart + 2);
        return {
          newValue,
          newSelectionStart: Math.max(lineStart, selectionStart - 2),
          newSelectionEnd: Math.max(lineStart, selectionEnd - 2),
        };
      }
    } else {
      // 들여쓰기
      const newValue = text.substring(0, selectionStart) + tabStr + text.substring(selectionEnd);
      return {
        newValue,
        newSelectionStart: selectionStart + 2,
        newSelectionEnd: selectionStart + 2,
      };
    }
  }

  // 2. Enter 자동 글머리 기호 연장
  if (key === 'Enter' && !shiftKey && selectionStart === selectionEnd) {
    const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
    const currentLine = text.substring(lineStart, selectionStart);

    // 순서 없는 목록 (- 또는 * ), 할 일 목록 (- [ ] 또는 - [x] ), 순서 있는 목록 (1. )
    const match = currentLine.match(/^(\s*)([-*]\s(\[[ x]\]\s)?|\d+\.\s)/);

    if (match) {
      const fullPrefix = match[0];

      // 접두사만 있고 내용이 없는 상태에서 Enter를 누른 경우 -> 글머리 기호 해제
      if (currentLine.trim() === fullPrefix.trim()) {
        const newValue = text.substring(0, lineStart) + text.substring(selectionStart);
        return {
          newValue,
          newSelectionStart: lineStart,
          newSelectionEnd: lineStart,
        };
      }

      let nextPrefix = fullPrefix;
      // 순서 있는 목록(1. 2. 3. ...)인 경우 번호 1 증가
      const numMatch = fullPrefix.match(/^(\s*)(\d+)\.\s/);
      if (numMatch) {
        const nextNum = parseInt(numMatch[2], 10) + 1;
        nextPrefix = `${numMatch[1]}${nextNum}. `;
      } else if (fullPrefix.includes('[x]') || fullPrefix.includes('[ ]')) {
        // 체크박스인 경우 새 줄은 빈 체크박스로 생성
        nextPrefix = fullPrefix.replace(/\[[ x]\]/, '[ ]');
      }

      const newValue = text.substring(0, selectionStart) + '\n' + nextPrefix + text.substring(selectionEnd);
      return {
        newValue,
        newSelectionStart: selectionStart + 1 + nextPrefix.length,
        newSelectionEnd: selectionStart + 1 + nextPrefix.length,
      };
    }
  }

  return null;
};

/**
 * 마크다운 구문(헤더, 굵게, 기울임, 링크, 이미지, 코드블록 등)을 제거하고 순수 텍스트만 추출합니다.
 */
export const stripMarkdown = (markdown?: string | null): string => {
  if (!markdown) return '';

  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^(\s*[-*+]|\d+\.)\s+/gm, '')
    .replace(/\|.*\|/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
};

/**
 * 텍스트의 글자 수 및 대략적인 읽기 소요 시간(분)을 계산합니다.
 */
export const getReadingTime = (
  text?: string | null,
  wordsPerMinute: number = 200
): { words: number; characters: number; minutes: number } => {
  if (!text) return { words: 0, characters: 0, minutes: 0 };

  const plainText = stripMarkdown(text);
  const characters = plainText.length;
  // 단어 분리 (공백 기준)
  const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));

  return { words, characters, minutes };
};
