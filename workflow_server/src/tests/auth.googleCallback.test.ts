/**
 * 🧪 [Domain: auth / Service: googleCallback]
 * - 기능: Google OAuth Authorization Code 수신 및 프론트엔드 리다이렉트 처리 단위 테스트
 * - 경우의 수: code 정상 교정 시 토큰과 함께 302 Redirect, code 누락 시 에러 302 Redirect
 */

import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [auth.googleCallback] Service & REST API Unit Tests', () => {
  let createdUserIds: number[] = [];

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.socialAccount.deleteMany({
        where: { userId: { in: createdUserIds } }
      });
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } }
      });
    }
  });

  describe('Case 1: 🔄 Google OAuth Authorization Code Callback 처리', () => {
    it('code 쿼리 파라미터 제출 시 리다이렉트(302) 응답이 반환되어야 한다', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback')
        .query({ code: 'mock_authorization_code_abc123' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('token=');
    });

    it('code 파라미터가 누락된 경우 에러 리다이렉트(302) 응답을 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error=no_code');
    });
  });
});
