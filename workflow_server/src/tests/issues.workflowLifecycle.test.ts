// -*- coding: utf-8 -*-
/**
 * 🧪 [Domain: issues / Service: fullWorkflowLifecycle]
 * - 기능: 이슈 생성 ➔ 댓글 작성 ➔ 좋아요/취소 ➔ 상태 변경 라이프사이클 통합 시나리오 테스트
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🧪 [issues.workflowLifecycle] Full End-to-End Integration Scenario Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;

  let createdIssueId: number;
  let createdCommentId: number;
  let inProgressStatusId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'lifecycle-workflow-user@example.com' },
      update: {},
      create: { email: 'lifecycle-workflow-user@example.com', name: 'Lifecycle User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Lifecycle Integration Test Project',
        key: `LITP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    let ipStatus = await prisma.issueStatus.findFirst({ where: { name: 'IN_PROGRESS' } });
    if (!ipStatus) {
      ipStatus = await prisma.issueStatus.create({ data: { name: 'IN_PROGRESS', category: 'IN_PROGRESS' } });
    }
    inProgressStatusId = ipStatus.id;
  });

  afterAll(async () => {
    if (createdCommentId) await prisma.comment.delete({ where: { id: createdCommentId } }).catch(() => {});
    if (createdIssueId) {
      await prisma.issueLike.deleteMany({ where: { issueId: createdIssueId } }).catch(() => {});
      await prisma.issue.delete({ where: { id: createdIssueId } }).catch(() => {});
    }
    if (testProject) await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    if (testUser) await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('🔄 이슈 라이프사이클 시나리오 검증', () => {
    it('Step 1: 이슈 생성 (POST /api/issues)', async () => {
      const response = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '통합 테스트 대상 이슈',
          description: '생성, 댓글, 좋아요, 상태변경 시나리오 테스트',
          projectId: testProject.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('통합 테스트 대상 이슈');
      createdIssueId = response.body.id;
    });

    it('Step 2: 댓글 달기 (POST /api/comments) 및 commentsCount 검증', async () => {
      const commentRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          issueId: createdIssueId,
          content: '첫 번째 테스트 댓글입니다.'
        });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body).toHaveProperty('id');
      createdCommentId = commentRes.body.id;

      // 댓글 달린 후 이슈 조회하여 commentsCount가 1인지 확인
      const issueRes = await request(app)
        .get(`/api/issues/${createdIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(issueRes.status).toBe(200);
      expect(issueRes.body.commentsCount).toBe(1);
    });

    it('Step 3: 좋아요 클릭 (POST /api/issues/like) 및 isLiked: true / likesCount: 1 검증', async () => {
      const likeRes = await request(app)
        .post('/api/issues/like')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: createdIssueId });

      expect(likeRes.status).toBe(201);

      // 이슈 조회하여 isLiked가 true, likesCount가 1인지 확인
      const issueRes = await request(app)
        .get(`/api/issues/${createdIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(issueRes.status).toBe(200);
      expect(issueRes.body.isLiked).toBe(true);
      expect(issueRes.body.likesCount).toBe(1);
    });

    it('Step 4: 좋아요 취소 (POST /api/issues/unlike) 및 isLiked: false / likesCount: 0 검증', async () => {
      const unlikeRes = await request(app)
        .post('/api/issues/unlike')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ issueId: createdIssueId });

      expect(unlikeRes.status).toBe(200);

      // 이슈 조회하여 isLiked가 false, likesCount가 0인지 확인
      const issueRes = await request(app)
        .get(`/api/issues/${createdIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(issueRes.status).toBe(200);
      expect(issueRes.body.isLiked).toBe(false);
      expect(issueRes.body.likesCount).toBe(0);
    });

    it('Step 5: 상태 변경 (PUT /api/issues/:id)', async () => {
      const updateRes = await request(app)
        .put(`/api/issues/${createdIssueId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ statusId: inProgressStatusId });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.statusId).toBe(inProgressStatusId);

      // 최종 상태 변경 반영 확인
      const issueRes = await request(app)
        .get(`/api/issues/${createdIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(issueRes.status).toBe(200);
      expect(issueRes.body.statusId).toBe(inProgressStatusId);
    });
  });
});
