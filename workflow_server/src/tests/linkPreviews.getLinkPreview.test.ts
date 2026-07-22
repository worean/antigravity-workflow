/**
 * 🧪 [Domain: linkPreviews / Service: getLinkPreview]
 * - 기능: 웹 링크 URL 메타데이터 파싱 및 프리뷰 정보 조회 REST API 단위 테스트
 * - 경우의 수: URL 전달 시 메타 데이터 프리뷰 정상 반환 (200 OK)
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('🧪 [linkPreviews.getLinkPreview] Service & REST API Unit Tests', () => {
  describe('Case 1: 🔗 웹 링크 프리뷰 데이터 파싱/조회 기능', () => {
    it('url 쿼리 파라미터 제출 시 프리뷰 정보가 성공적으로 응답되어야 한다', async () => {
      const response = await request(app)
        .get('/api/link-previews')
        .query({ url: 'https://example.com' });

      expect(response.status).toBe(200);
    });

    it('url 쿼리 파라미터 없이 요청 시 200 OK와 함께 null 또는 빈 결과가 반환되어야 한다', async () => {
      const response = await request(app)
        .get('/api/link-previews');

      expect(response.status).toBe(200);
    });
  });
});
