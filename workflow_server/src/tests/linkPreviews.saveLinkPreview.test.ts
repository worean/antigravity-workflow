/**
 * 🧪 [Domain: linkPreviews / Service: saveLinkPreview]
 * - 기능: 링크 프리뷰 캐시 DB 저장 REST API 단위 테스트
 * - 경우의 수: URL 및 타이틀 정보 캐시 저장 성공 (201 Created), URL 누락 예외 (400 Bad Request)
 */

import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [linkPreviews.saveLinkPreview] Service & REST API Unit Tests', () => {
  let createdUrl: string = 'https://example.com/test-save-preview';

  afterAll(async () => {
    await prisma.linkPreview.delete({ where: { url: createdUrl } }).catch(() => {});
  });

  describe('Case 1: 💾 링크 프리뷰 캐시 저장 기능', () => {
    it('url 및 title 데이터 전달 시 프리뷰 캐시 정보가 성공적으로 저장되어야 한다 (201 Created)', async () => {
      const response = await request(app)
        .post('/api/link-previews/save')
        .send({
          url: createdUrl,
          title: 'Test Example Domain',
          description: 'Example Domain Description'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('url', createdUrl);
      expect(response.body).toHaveProperty('title', 'Test Example Domain');
    });

    it('url 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/link-previews/save')
        .send({
          title: 'No URL Preview'
        });

      expect(response.status).toBe(400);
    });
  });
});
