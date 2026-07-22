/**
 * 🧪 [Domain: issues / Service: getIssues]
 * - 기능: 전체 이슈 목록 조회 REST API 단위 테스트
 * - 경우의 수: 전체 이슈 목록 배열 정상 반환 (200 OK)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [issues.getIssues] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'get-issues-user@example.com' },
      update: {},
      create: { email: 'get-issues-user@example.com', name: 'GetIssues User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 📋 이슈 목록 조회 기능', () => {
    it('이슈 목록 요청 시 성공적으로 전체 목록 배열이 반환되어야 한다', async () => {
      const response = await request(app)
        .get('/api/issues/list')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
