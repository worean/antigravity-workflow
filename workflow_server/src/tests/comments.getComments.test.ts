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
      expect(response.headers).toHaveProperty('x-total-count');
      expect(response.headers).toHaveProperty('x-page');
    });
  });

  describe('Case 2: ⚡ 댓글 페이지네이션(page, limit) 및 메타데이터 지원', () => {
    let testProject: any;
    let testIssue: any;
    let createdCommentIds: number[] = [];

    beforeAll(async () => {
      testProject = await prisma.project.create({
        data: {
          name: 'Comments Pagination Test Project',
          key: 'CPTP',
          ownerId: testUser.id,
        }
      });

      testIssue = await prisma.issue.create({
        data: {
          title: 'Comments Pagination Issue',
          issueNumber: 1,
          projectId: testProject.id,
          authorId: testUser.id,
        }
      });

      // 댓글 5개 생성
      for (let i = 1; i <= 5; i++) {
        const c = await prisma.comment.create({
          data: {
            issueId: testIssue.id,
            authorId: testUser.id,
            content: `Pagination Comment #${i}`,
          }
        });
        createdCommentIds.push(c.id);
      }
    });

    afterAll(async () => {
      await prisma.comment.deleteMany({ where: { id: { in: createdCommentIds } } }).catch(() => {});
      if (testIssue) {
        await prisma.issue.delete({ where: { id: testIssue.id } }).catch(() => {});
      }
      if (testProject) {
        await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
      }
    });

    it('limit=2 적용 시 2개의 댓글만 반환되고 X-Total-Count 헤더가 정확해야 한다', async () => {
      const response = await request(app)
        .get(`/api/comments/issue/${testIssue.id}?limit=2&page=1`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.headers['x-total-count']).toBe('5');
      expect(response.headers['x-limit']).toBe('2');
      expect(response.headers['x-total-pages']).toBe('3');
    });

    it('page=2&limit=2 요청 시 2페이지의 댓글이 반환되어야 한다', async () => {
      const page1Res = await request(app)
        .get(`/api/comments/issue/${testIssue.id}?page=1&limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      const page2Res = await request(app)
        .get(`/api/comments/issue/${testIssue.id}?page=2&limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(page1Res.status).toBe(200);
      expect(page2Res.status).toBe(200);
      expect(page2Res.body.length).toBe(2);
      expect(page1Res.body[0].id).not.toBe(page2Res.body[0].id);
      expect(page2Res.headers['x-page']).toBe('2');
    });

    it('withMeta=true 쿼리 시 { items, total, page, limit, totalPages } 객체 형태로 반환되어야 한다', async () => {
      const response = await request(app)
        .get(`/api/comments/issue/${testIssue.id}?limit=3&page=1&withMeta=true`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total', 5);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 3);
      expect(response.body).toHaveProperty('totalPages', 2);
      expect(response.body.items.length).toBe(3);
    });
  });
});
