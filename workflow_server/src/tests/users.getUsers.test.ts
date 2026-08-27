// -*- coding: utf-8 -*-
/**
 * 🧪 [Domain: users / Service: getUsers]
 * - 기능: 전체 사용자 목록 조회 REST API 단위 테스트
 * - 경우의 수: 사용자 목록 배열 정상 반환 (200 OK)
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [users.getUsers] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';

  describe('Case 1: 📋 전체 유저 목록 조회 기능', () => {
    it('전체 유저 목록 요청 시 성공적으로 목록 배열이 반환되어야 한다', async () => {
      let testUser = await prisma.user.findFirst();
      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            email: `get_users_test_${Date.now()}@example.com`,
            name: 'GetUsers Test',
            password: 'hashed_pwd',
          },
        });
      }

      const token = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
