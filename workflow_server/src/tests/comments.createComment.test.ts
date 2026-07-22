/**
 * 🧪 [Domain: comments / Service: createComment]
 * - 기능: 이슈 내 댓글 신규 작성 REST API 단위 테스트
 * - 경우의 수: 유효한 댓글 내용 등록 성공 (201 Created), 필수 파라미터(content/issueId) 누락 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [comments.createComment] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let testIssue: any;
  let createdCommentId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'comment-user@example.com' },
      update: {},
      create: { email: 'comment-user@example.com', name: 'Comment User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Comment Test Project',
        key: `CTP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    testIssue = await createIssueService({ title: 'Comment Issue', projectId: testProject.id, authorId: testUser.id });
  });

  afterAll(async () => {
    if (createdCommentId) await prisma.comment.delete({ where: { id: createdCommentId } }).catch(() => {});
    await prisma.issue.delete({ where: { id: testIssue.id } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 💬 댓글 작성 기능', () => {
    it('유효한 이슈 ID와 댓글 내용 전달 시 댓글 생성이 성공해야 한다', async () => {
      const response = await request(app)
        .post('/api/comments/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          issueId: testIssue.id,
          authorId: testUser.id,
          content: 'This is a test comment.'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('This is a test comment.');

      createdCommentId = response.body.id;
    });

    it('필수 데이터(content 또는 issueId) 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/comments/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          issueId: testIssue.id
        });

      expect(response.status).toBe(400);
    });
  });
});
