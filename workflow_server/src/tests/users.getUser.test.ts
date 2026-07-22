/**
 * 🧪 [Domain: users / Service: getUser]
 * - 기능: 단일 사용자 상세 정보 조회 REST API 단위 테스트
 * - 경우의 수: 존재하는 유저 ID로 상세 정보 조회 성공 (200 OK), 존재하지 않는 유저 ID 404 Not Found 예외
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [users.getUser] Service & REST API Unit Tests', () => {
  let testUser: { id: number; email: string };

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'get-single-user@example.com' },
      update: {},
      create: { email: 'get-single-user@example.com', name: 'Single User' }
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 🔍 단일 유저 상세 조회 기능', () => {
    it('존재하는 유저 ID로 조회 시 유저 상세 정보를 반환해야 한다', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body.email).toBe('get-single-user@example.com');
    });

    it('존재하지 않는 유저 ID로 조회 시 404 Not Found 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/users/9999999');

      expect(response.status).toBe(404);
    });
  });
});
