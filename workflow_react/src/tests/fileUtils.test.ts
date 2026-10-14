﻿import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  getFileExtension,
  getFileCategory,
  isImageFile,
  validateFile,
} from '../utils/fileUtils';

describe('fileUtils', () => {
  describe('formatFileSize', () => {
    it('유효하지 않거나 0 이하의 입력에 대해 0 B를 반환해야 한다', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(null)).toBe('0 B');
      expect(formatFileSize(undefined)).toBe('0 B');
      expect(formatFileSize(-10)).toBe('0 B');
    });

    it('바이트 크기를 KB, MB, GB로 올바르게 변환해야 한다', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 5.25, 2)).toBe('5.25 MB');
      expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
    });
  });

  describe('getFileExtension', () => {
    it('파일명에서 확장자를 정확히 소문자로 추출해야 한다', () => {
      expect(getFileExtension('report.PDF')).toBe('pdf');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('no-ext')).toBe('');
      expect(getFileExtension('.gitignore')).toBe('');
      expect(getFileExtension('path/to/file.png?query=123')).toBe('png');
    });
  });

  describe('getFileCategory & isImageFile', () => {
    it('MIME 타입 및 확장자를 통해 올바른 카테고리를 판별해야 한다', () => {
      expect(getFileCategory('image/png')).toBe('image');
      expect(getFileCategory('', 'photo.JPEG')).toBe('image');
      expect(isImageFile('photo.png')).toBe(true);

      expect(getFileCategory('video/mp4')).toBe('video');
      expect(getFileCategory('', 'clip.mov')).toBe('video');

      expect(getFileCategory('application/pdf')).toBe('document');
      expect(getFileCategory('', 'doc.xlsx')).toBe('document');

      expect(getFileCategory('', 'bundle.zip')).toBe('archive');
      expect(getFileCategory('', 'index.tsx')).toBe('code');
      expect(getFileCategory('', 'unknown.xyz')).toBe('other');
    });
  });

  describe('validateFile', () => {
    it('최대 크기 초과 시 에러를 반환해야 한다', () => {
      const mockFile = new File(['a'.repeat(100)], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(mockFile, 'size', { value: 25 * 1024 * 1024 });

      const res = validateFile(mockFile, { maxSizeBytes: 20 * 1024 * 1024 });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('파일 크기는 최대 20 MB');
    });

    it('허용되지 않은 확장자일 경우 에러를 반환해야 한다', () => {
      const mockFile = new File(['dummy'], 'danger.exe', { type: 'application/x-msdownload' });
      const res = validateFile(mockFile, { allowedExtensions: ['png', 'jpg', 'pdf'] });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('허용되지 않은 파일 형식입니다');
    });

    it('조건을 만족할 경우 유효 판정을 내려야 한다', () => {
      const mockFile = new File(['image-content'], 'avatar.png', { type: 'image/png' });
      const res = validateFile(mockFile, {
        maxSizeBytes: 5 * 1024 * 1024,
        allowedExtensions: ['png', 'jpg'],
        allowedMimeTypes: ['image/*'],
      });
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });
});
