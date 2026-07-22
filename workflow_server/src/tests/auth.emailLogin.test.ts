/**
 * 🧪 [Domain: auth / Service: emailLogin]
 * - 기능: 이메일 & 비밀번호 기반 사용자 인증 및 JWT 토큰 발급 REST API 단위 테스트
 * - 경우의 수: 올바른 인증 성공 (200 OK + JWT), 이메일 미존재 실패 (400), 비밀번호 불일치 실패 (400), 필드 누락 예외 (400)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [auth.emailLogin] Service & REST API Unit Tests', () => {
  const testEmail = 'unittest-login-user@example.com';
  const testPassword = 'Password123!';
  let testUser: { id: number; email: string; name: string | null };

  beforeAll(async () => {
    // 테스트용 이메일 로그인 유저 생성
    testUser = await prisma.user.upsert({
      where: { email: testEmail },
      update: { password: testPassword },
      create: {
        email: testEmail,
        password: testPassword,
        name: 'Login Tester'
      }
    });
  });

  afterAll(async () => {
    // 테스트 유저 cleanup
    await prisma.user.delete({
      where: { id: testUser.id }
    });
  });

  describe('Case 1: 🔑 정상 로그인 검증 (Success Use-Cases)', () => {
    it('올바른 이메일과 비밀번호 제출 시 JWT 토큰과 유저 정보가 성공적으로 반환되어야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', testEmail);
    });
  });

  describe('Case 2: ❌ 잘못된 입력 및 예외 처리 검증 (Error Use-Cases)', () => {
    it('존재하지 않는 이메일 제출 시 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent-email-999@example.com',
          password: testPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('User not found');
    });

    it('비밀번호가 불일치할 경우 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword999!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid password');
    });

    it('이메일 파라미터가 누락된 경우 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: testPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('비밀번호 파라미터가 누락된 경우 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
