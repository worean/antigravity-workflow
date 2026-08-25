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

  describe('Case 3: ⚡ 개수 제한(limit/take), 건너뛰기(skip/offset) 및 정렬(sortBy/order)', () => {
    let testProject: any;
    let createdIssueIds: number[] = [];

    beforeAll(async () => {
      testProject = await prisma.project.create({
        data: {
          name: 'Issues Pagination Test Project',
          key: 'IPT',
          ownerId: testUser.id,
        }
      });

      // 테스트용 이슈 3개 생성 (각기 다른 제목, 작성자/담당자)
      for (let i = 1; i <= 3; i++) {
        const issue = await prisma.issue.create({
          data: {
            title: `Pagination Issue ${i}`,
            issueNumber: i,
            projectId: testProject.id,
            authorId: testUser.id,
            assigneeId: i === 1 ? testUser.id : null,
          }
        });
        createdIssueIds.push(issue.id);
      }
    });

    afterAll(async () => {
      await prisma.issue.deleteMany({ where: { id: { in: createdIssueIds } } }).catch(() => {});
      if (testProject) {
        await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
      }
    });

    it('limit 파라미터 적용 시 지정된 개수 이하로 반환되어야 한다', async () => {
      const response = await request(app)
        .get(`/api/issues?projectId=${testProject.id}&limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('skip 및 limit 파라미터로 페이지네이션이 동작해야 한다', async () => {
      const resPage1 = await request(app)
        .get(`/api/issues?projectId=${testProject.id}&limit=1&skip=0&sortBy=id&order=asc`)
        .set('Authorization', `Bearer ${authToken}`);

      const resPage2 = await request(app)
        .get(`/api/issues?projectId=${testProject.id}&limit=1&skip=1&sortBy=id&order=asc`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(resPage1.status).toBe(200);
      expect(resPage2.status).toBe(200);
      expect(resPage1.body.length).toBe(1);
      expect(resPage2.body.length).toBe(1);
      expect(resPage1.body[0].id).not.toBe(resPage2.body[0].id);
    });

    it('assigneeId=my 파라미터 적용 시 현재 로그인 사용자에게 할당된 이슈만 필터링되어야 한다', async () => {
      const response = await request(app)
        .get(`/api/issues?projectId=${testProject.id}&assigneeId=my`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].assigneeId).toBe(testUser.id);
    });

    it('sortBy 및 order 파라미터로 정렬 방향이 적용되어야 한다', async () => {
      const resDesc = await request(app)
        .get(`/api/issues?projectId=${testProject.id}&sortBy=id&order=desc`)
        .set('Authorization', `Bearer ${authToken}`);

      const resAsc = await request(app)
        .get(`/api/issues?projectId=${testProject.id}&sortBy=id&order=asc`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(resDesc.status).toBe(200);
      expect(resAsc.status).toBe(200);
      expect(resDesc.body[0].id).toBeGreaterThan(resAsc.body[0].id);
    });

    it('X-Total-Count 등 페이지네이션 헤더가 정상적으로 반환되어야 한다', async () => {
      const response = await request(app)
        .get(`/api/issues?projectId=${testProject.id}&limit=2&page=1`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['x-total-count']).toBe('3');
      expect(response.headers['x-page']).toBe('1');
      expect(response.headers['x-limit']).toBe('2');
      expect(response.headers['x-total-pages']).toBe('2');
    });

    it('withMeta=true 파라미터 요청 시 { items, total, page, limit, totalPages } 구조로 반환되어야 한다', async () => {
      const response = await request(app)
        .get(`/api/issues?projectId=${testProject.id}&limit=2&page=1&withMeta=true`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total', 3);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 2);
      expect(response.body).toHaveProperty('totalPages', 2);
      expect(response.body.items.length).toBe(2);
    });
  });
});
