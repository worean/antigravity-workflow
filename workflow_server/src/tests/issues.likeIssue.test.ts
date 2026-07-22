/**
 * 🧪 [Domain: issues / Service: likeIssue]
 * - 기능: 이슈 좋아요 / 토글 REST API 단위 테스트
 * - 경우의 수: 인증된 사용자의 이슈 좋아요 등록 성공 (201 Created), 존재하지 않는 이슈 ID 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [issues.likeIssue] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let targetIssueId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'like-issue-user@example.com' },
      update: {},
      create: { email: 'like-issue-user@example.com', name: 'LikeIssue User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Like Issue Test Project',
        key: `LITP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    const issue = await createIssueService({ title: 'Like Target Issue', projectId: testProject.id, authorId: testUser.id });
    targetIssueId = issue.id;
  });

  afterAll(async () => {
    await prisma.issueLike.deleteMany({ where: { issueId: targetIssueId } });
    await prisma.issue.delete({ where: { id: targetIssueId } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 👍 이슈 좋아요 / 토글 기능', () => {
    it('이슈에 좋아요 클릭 성공 시 결과가 반환되어야 한다 (201 Created)', async () => {
      const response = await request(app)
        .post('/api/issues/like')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: targetIssueId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
    });

    it('존재하지 않는 이슈 ID에 좋아요 클릭 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/issues/like')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: 9999999 });

      expect(response.status).toBe(400);
    });
  });
});
