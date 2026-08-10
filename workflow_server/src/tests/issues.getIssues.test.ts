// -*- coding: utf-8 -*-
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
        .get('/api/issues')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('isLiked');
        expect(response.body[0]).toHaveProperty('likesCount');
        expect(response.body[0]).toHaveProperty('commentsCount');
        expect(response.body[0]).toHaveProperty('attachmentsCount');
        expect(response.body[0]).toHaveProperty('childrenCount');
      }
    });
  });

  describe('Case 2: 🔍 검색 및 필터링 쿼리 적용 조회', () => {
    it('search 쿼리 파라미터 적용 시 필터링된 이슈 목록이 반환되어야 한다', async () => {
      const response = await request(app)
        .get('/api/issues?search=nonexistent_test_query_string_12345')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('인증 토큰 없이 요청 시 로그인 필요(401 Unauthorized) 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/issues');

      expect(response.status).toBe(401);
    });
  });
});
