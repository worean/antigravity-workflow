﻿import { describe, it, expect } from 'vitest';
import {
  applyMarkdownSyntax,
  handleMarkdownKeyAction,
  stripMarkdown,
  getReadingTime,
} from '../utils/markdownUtils';

describe('markdownUtils', () => {
  describe('applyMarkdownSyntax', () => {
    it('선택된 텍스트 앞뒤로 문법을 정상 감싸야 한다', () => {
      const text = 'Hello world!';
      // 'world' 선택 (index 6 ~ 11)
      const res = applyMarkdownSyntax(text, 6, 11, '**', '**');
      expect(res.newValue).toBe('Hello **world**!');
      expect(res.newSelectionStart).toBe(8);
      expect(res.newSelectionEnd).toBe(13);
    });

    it('선택 영역이 없을 때 defaultText를 삽입해야 한다', () => {
      const text = 'Hello ';
      const res = applyMarkdownSyntax(text, 6, 6, '**', '**', 'bold');
      expect(res.newValue).toBe('Hello **bold**');
    });
  });

  describe('handleMarkdownKeyAction', () => {
    it('Tab 입력 시 2스페이스 들여쓰기를 적용해야 한다', () => {
      const text = 'Code line';
      const res = handleMarkdownKeyAction('Tab', false, text, 0, 0);
      expect(res).not.toBeNull();
      expect(res?.newValue).toBe('  Code line');
      expect(res?.newSelectionStart).toBe(2);
    });

    it('Shift+Tab 입력 시 2스페이스 내어쓰기를 적용해야 한다', () => {
      const text = '  Indented line';
      const res = handleMarkdownKeyAction('Tab', true, text, 2, 2);
      expect(res).not.toBeNull();
      expect(res?.newValue).toBe('Indented line');
      expect(res?.newSelectionStart).toBe(0);
    });

    it('Enter 입력 시 순서 있는 목록 번호를 1 증가시켜야 한다', () => {
      const text = '1. First task';
      const res = handleMarkdownKeyAction('Enter', false, text, 13, 13);
      expect(res).not.toBeNull();
      expect(res?.newValue).toBe('1. First task\n2. ');
    });

    it('Enter 입력 시 체크박스를 빈 체크박스로 연장해야 한다', () => {
      const text = '- [x] Done item';
      const res = handleMarkdownKeyAction('Enter', false, text, 15, 15);
      expect(res).not.toBeNull();
      expect(res?.newValue).toBe('- [x] Done item\n- [ ] ');
    });
  });

  describe('stripMarkdown & getReadingTime', () => {
    it('마크다운 헤더, 굵게, 링크 구문을 깔끔하게 제거해야 한다', () => {
      const md = '# Header\n**Bold text** and [Link](https://example.com) and code';
      const stripped = stripMarkdown(md);
      expect(stripped).toContain('Header');
      expect(stripped).toContain('Bold text and Link and code');
      expect(stripped).not.toContain('#');
      expect(stripped).not.toContain('**');
      expect(stripped).not.toContain('https://example.com');
    });

    it('단어 수와 읽기 소요 시간을 정확히 산출해야 한다', () => {
      const md = '# Title\nThis is a sample document for testing reading time calculation.';
      const res = getReadingTime(md);
      expect(res.words).toBeGreaterThan(5);
      expect(res.characters).toBeGreaterThan(20);
      expect(res.minutes).toBe(1);
    });
  });
});
