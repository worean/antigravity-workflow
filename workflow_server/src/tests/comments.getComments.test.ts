/**
 * 🧪 [Domain: comments / Service: getComments]
 * - 기능: 특정 이슈에 등록된 댓글 목록 조회 REST API 단위 테스트
 * - 경우의 수: 이슈 ID 경로로 댓글 목록 성공 조회 (200 OK 배열 반환)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [comments.getComments] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'get-comments-user@example.com' },
      update: {},
      create: { email: 'get-comments-user@example.com', name: 'GetComments User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 📋 이슈별 댓글 목록 조회 기능', () => {
    it('이슈 ID 경로로 댓글 조회 요청 시 댓글 목록이 반환되어야 한다', async () => {
      const response = await request(app)
        .get('/api/comments/list/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
