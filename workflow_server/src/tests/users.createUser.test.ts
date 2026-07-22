/**
 * 🧪 [Domain: users / Service: createUser]
 * - 기능: 신규 사용자 계정 가입/등록 REST API 단위 테스트
 * - 경우의 수: 유효한 계정 정보로 가입 성공 (201 Created), 중복 이메일 차단 예외 (400), 필수 파라미터 누락 예외 (400)
 */

import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [users.createUser] Service & REST API Unit Tests', () => {
  const testEmail = `create-user-test-${Date.now()}@example.com`;
  let createdUserId: number;

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
  });

  describe('Case 1: 👤 유저 신규 생성 기능', () => {
    it('유효한 이메일과 이름 전달 시 유저가 정상 생성되어야 한다 (201 Created)', async () => {
      const response = await request(app)
        .post('/api/users/create')
        .send({
          email: testEmail,
          name: 'New Test User',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testEmail);

      createdUserId = response.body.id;
    });

    it('이미 존재하는 이메일로 가입 요청 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/users/create')
        .send({
          email: testEmail,
          name: 'Duplicate User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('이메일 파라미터 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/users/create')
        .send({
          name: 'No Email User'
        });

      expect(response.status).toBe(400);
    });
  });
});
