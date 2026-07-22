/**
 * 🧪 [Domain: comments / Service: deleteComment]
 * - 기능: 댓글 삭제 REST API 단위 테스트
 * - 경우의 수: 작성자 삭제 성공 (200 OK), 존재하지 않는 댓글 ID 삭제 요청 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [comments.deleteComment] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let testIssue: any;
  let targetCommentId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'del-comment-user@example.com' },
      update: {},
      create: { email: 'del-comment-user@example.com', name: 'DelComment User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Del Comment Project',
        key: `DCP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    testIssue = await createIssueService({ title: 'Del Comment Issue', projectId: testProject.id, authorId: testUser.id });

    const comment = await prisma.comment.create({
      data: {
        content: 'Comment to be deleted',
        issueId: testIssue.id,
        authorId: testUser.id
      }
    });
    targetCommentId = comment.id;
  });

  afterAll(async () => {
    await prisma.issue.delete({ where: { id: testIssue.id } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 🗑️ 댓글 삭제 기능', () => {
    it('댓글 작성자가 삭제 요청 시 성공적으로 삭제되어야 한다', async () => {
      const response = await request(app)
        .delete(`/api/comments/delete/${targetCommentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const checkComment = await prisma.comment.findUnique({ where: { id: targetCommentId } });
      expect(checkComment).toBeNull();
    });

    it('존재하지 않는 댓글 ID 삭제 요청 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .delete('/api/comments/delete/9999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });
});
