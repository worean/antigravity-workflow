/**
 * 🧪 [Domain: issues / Service: likeIssue Edge Cases]
 * - 기능: 좋아요 / 좋아요 취소 시 likesCount 증감 및 경계 조건(Edge Cases) 단위 테스트
 * - 테스트 항목:
 *   1. 최초 like 시 likesCount가 0 ➔ 1로 증가하고 isLiked가 true로 변경되는지 검증
 *   2. 이미 like 된 상태에서 중복 like 시 likesCount가 중복 증가하지 않고 1로 유지되는지 검증 (멱등성)
 *   3. unlike 시 likesCount가 1 ➔ 0으로 감소하고 isLiked가 false로 변경되는지 검증
 *   4. 이미 unlike 된 상태에서 중복 unlike 시 likesCount가 0으로 안전 유지되는지 검증
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [issues.likeIssueCountAndEdge] Like / Unlike Edge Cases & Count Verification', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let targetIssueId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'like-edge-test-user@example.com' },
      update: {},
      create: { email: 'like-edge-test-user@example.com', name: 'Like Edge Test User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Like Edge Case Test Project',
        key: `LETP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    const issue = await createIssueService({
      title: 'Like/Unlike Edge Case Target Issue',
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

  describe('📊 Like / Unlike 카운트 증감 및 중복 액션 경계 조건 테스트', () => {
    it('Case 0: 초기 상태 조회 ➔ likesCount는 0이고 isLiked는 false이어야 한다', async () => {
      const getRes = await request(app)
        .get(`/api/issues/get/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.likesCount).toBe(0);
      expect(getRes.body.isLiked).toBe(false);
    });

    it('Case 1: 최초 like 시 ➔ likesCount가 1로 증가하고 isLiked가 true로 변경되어야 한다', async () => {
      const likeRes = await request(app)
        .post('/api/issues/like')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: targetIssueId });

      expect(likeRes.status).toBe(201);

      const getRes = await request(app)
        .get(`/api/issues/get/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.likesCount).toBe(1);
      expect(getRes.body.isLiked).toBe(true);
    });

    it('Case 2: 이미 like 된 상태에서 중복 like 시 ➔ likesCount가 1로 유지되고 에러 없이 멱등 처리되어야 한다', async () => {
      const duplicateLikeRes = await request(app)
        .post('/api/issues/like')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: targetIssueId });

      expect(duplicateLikeRes.status).toBe(201);

      const getRes = await request(app)
        .get(`/api/issues/get/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.likesCount).toBe(1); // 카운트가 2로 중복 증가하지 않고 1 유지
      expect(getRes.body.isLiked).toBe(true);
    });

    it('Case 3: unlike 시 ➔ likesCount가 0으로 감소하고 isLiked가 false로 변경되어야 한다', async () => {
      const unlikeRes = await request(app)
        .post('/api/issues/unlike')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: targetIssueId });

      expect(unlikeRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/issues/get/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.likesCount).toBe(0); // 1 ➔ 0으로 감소
      expect(getRes.body.isLiked).toBe(false);
    });

    it('Case 4: 이미 unlike 된 상태에서 중복 unlike 시 ➔ likesCount가 0으로 안전 유지되어야 한다', async () => {
      const duplicateUnlikeRes = await request(app)
        .post('/api/issues/unlike')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: targetIssueId });

      expect(duplicateUnlikeRes.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/issues/get/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.likesCount).toBe(0); // 음수가 되지 않고 0 유지
      expect(getRes.body.isLiked).toBe(false);
    });
  });
});
