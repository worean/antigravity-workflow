/**
 * 🧪 [Domain: issues / Service: toggleLikeIssue]
 * - 기능: 단일 이슈 좋아요 토글 REST API 단위 테스트 (POST /api/issues/toggle-like)
 * - 경우의 수:
 *   1. 미좋아요 상태에서 토글 시 ➔ 좋아요 등록 (isLiked: true, likesCount: 1)
 *   2. 좋아요 상태에서 토글 시 ➔ 좋아요 해제 (isLiked: false, likesCount: 0)
 *   3. 존재하지 않는 이슈 ID 전달 시 ➔ 400 Bad Request
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [issues.toggleLikeIssue] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let targetIssueId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'toggle-like-user@example.com' },
      update: {},
      create: { email: 'toggle-like-user@example.com', name: 'ToggleLike User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Toggle Like Test Project',
        key: `TLTP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    const issue = await createIssueService({
      title: 'Toggle Like Target Issue',
      projectId: testProject.id,
      authorId: testUser.id
    });
    targetIssueId = issue.id;
  });

  afterAll(async () => {
    if (targetIssueId) {
      await prisma.issueLike.deleteMany({ where: { issueId: targetIssueId } }).catch(() => {});
      await prisma.issue.delete({ where: { id: targetIssueId } }).catch(() => {});
    }
    if (testProject) await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    if (testUser) await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('🔄 이슈 좋아요 토글 (POST /api/issues/toggle-like) 기능 검증', () => {
    it('1차 토글 호출 시 ➔ 좋아요가 생성되고 isLiked가 true, likesCount가 1이 반환되어야 한다', async () => {
      const response = await request(app)
        .post('/api/issues/toggle-like')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: targetIssueId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isLiked', true);
      expect(response.body).toHaveProperty('likesCount', 1);
    });

    it('2차 토글 호출 시 ➔ 좋아요가 삭제되고 isLiked가 false, likesCount가 0이 반환되어야 한다', async () => {
      const response = await request(app)
        .post('/api/issues/toggle-like')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: targetIssueId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isLiked', false);
      expect(response.body).toHaveProperty('likesCount', 0);
    });

    it('존재하지 않는 이슈 ID로 토글 요청 시 ➔ 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/issues/toggle-like')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: 9999999 });

      expect(response.status).toBe(400);
    });
  });
});
