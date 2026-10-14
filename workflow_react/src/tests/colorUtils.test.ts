﻿import { describe, it, expect } from 'vitest';
import {
  isValidHex,
  rgbToHex,
  hexToRgba,
  adjustColorBrightness,
  parseColorToRgb,
  getOptimalContrastText,
  PALETTE_PRESETS,
} from '../utils/colorUtils';

describe('colorUtils', () => {
  describe('isValidHex', () => {
    it('3자리, 6자리, 8자리 HEX 색상 코드를 올바르게 검증해야 한다', () => {
      expect(isValidHex('#fff')).toBe(true);
      expect(isValidHex('#ffffff')).toBe(true);
      expect(isValidHex('#38bdf8')).toBe(true);
      expect(isValidHex('#38bdf8aa')).toBe(true);
      expect(isValidHex('123456')).toBe(false); // # 누락
      expect(isValidHex('#gggggg')).toBe(false); // 16진수 아님
      expect(isValidHex('#12')).toBe(false);
      expect(isValidHex(null)).toBe(false);
    });
  });

  describe('rgbToHex & hexToRgba', () => {
    it('r, g, b 수치를 HEX 문자열로 변환해야 한다', () => {
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(56, 189, 248)).toBe('#38bdf8');
    });

    it('HEX 색상을 rgba 문자열로 올바르게 변환해야 한다', () => {
      expect(hexToRgba('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
      expect(hexToRgba('#38bdf8', 1)).toBe('rgba(56, 189, 248, 1)');
    });
  });

  describe('adjustColorBrightness', () => {
    it('퍼센트 값에 따라 색상 밝기를 올바르게 증감해야 한다', () => {
      const lighter = adjustColorBrightness('#000000', 50);
      const parsed = parseColorToRgb(lighter);
      expect(parsed.r).toBeGreaterThan(0);

      const darker = adjustColorBrightness('#ffffff', -50);
      const parsedDarker = parseColorToRgb(darker);
      expect(parsedDarker.r).toBeLessThan(255);
    });
  });

  describe('getOptimalContrastText', () => {
    it('밝은 배경에는 어두운 텍스트, 어두운 배경에는 흰색 텍스트를 반환해야 한다', () => {
      const whiteBg = getOptimalContrastText('#ffffff');
      expect(whiteBg.color).toBe('#0f172a');
      expect(whiteBg.tone).toBe('light');

      const darkBg = getOptimalContrastText('#1e1e1e');
      expect(darkBg.color).toBe('#ffffff');
      expect(darkBg.tone).toBe('dark');
    });
  });

  describe('PALETTE_PRESETS', () => {
    it('프리셋 색상들이 모두 유효한 HEX 형식이어야 한다', () => {
      expect(PALETTE_PRESETS.length).toBeGreaterThan(10);
      PALETTE_PRESETS.forEach((hex) => {
        expect(isValidHex(hex)).toBe(true);
      });
    });
  });
});
