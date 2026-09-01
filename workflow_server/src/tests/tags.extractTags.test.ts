import { describe, it, expect } from 'vitest';
import { extractTags, getTagColor } from '../modules/tags/services/extractTags.js';

describe('Tags Service - extractTags Unit Tests', () => {
  it('문자열에서 #해시태그 목록을 정확하게 추출한다', () => {
    const text = '#태그 #태그1 버그수정 #긴급_이슈 #v2.0';
    const tags = extractTags(text);
    expect(tags).toEqual(['태그', '태그1', '긴급_이슈', 'v2.0']);
  });

  it('배열 형태의 입력에서도 해시태그를 정확히 정규화하여 추출한다', () => {
    const input = ['#프론트엔드', '백엔드', '#API-v1'];
    const tags = extractTags(input);
    expect(tags).toEqual(['프론트엔드', '백엔드', 'API-v1']);
  });

  it('중복된 태그는 하나로 합쳐서 반환한다', () => {
    const text = '#버그 #기능 #버그 #긴급 #기능';
    const tags = extractTags(text);
    expect(tags).toEqual(['버그', '기능', '긴급']);
  });

  it('빈 문자열이나 null이 전달되면 빈 배열을 반환한다', () => {
    expect(extractTags('')).toEqual([]);
    expect(extractTags(null)).toEqual([]);
    expect(extractTags(undefined)).toEqual([]);
  });

  it('동일한 태그명에 대해 일관된 색상 Hex 코드를 반환한다', () => {
    const color1 = getTagColor('버그');
    const color2 = getTagColor('버그');
    expect(color1).toBe(color2);
    expect(color1).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
