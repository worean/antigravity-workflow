/**
 * 🧪 [Domain: auth / Service: googleLogin]
 * - 기능: Google OAuth Access Token 기반 로그인 및 소셜 회원가입 처리 단위 테스트
 * - 경우의 수: 유효한 Google Access Token 수신 시 소셜 계정 연동 및 JWT 토큰 발급 (200 OK), 토큰 누락 예외 (400)
 */

import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [auth.googleLogin] Service & REST API Unit Tests', () => {
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

  describe('Case 1: 🔑 Google OAuth Access Token으로 로그인/회원가입 처리', () => {
    it('유효한 accessToken 전송 시 회원 등록 후 JWT 토큰과 유저 정보가 반환되어야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({ accessToken: 'mock_google_access_token_12345' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('isGoogleLinked', true);

      createdUserIds.push(response.body.user.id);
    });

    it('accessToken 데이터 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
