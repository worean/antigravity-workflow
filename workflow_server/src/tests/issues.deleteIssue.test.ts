/**
 * 🧪 [Domain: issues / Service: deleteIssue]
 * - 기능: 이슈 삭제 REST API 단위 테스트
 * - 경우의 수: 이슈 삭제 성공 (200 OK), 존재하지 않는 이슈 ID 삭제 요청 예외 (400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [issues.deleteIssue] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let targetIssueId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'delete-issue-user@example.com' },
      update: {},
      create: { email: 'delete-issue-user@example.com', name: 'DeleteIssue User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Delete Issue Test Project',
        key: `DITP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    const issue = await createIssueService({ title: 'Delete Target Issue', projectId: testProject.id, authorId: testUser.id });
    targetIssueId = issue.id;
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: 🗑️ 이슈 삭제 기능', () => {
    it('이슈 삭제 성공 시 200 OK 응답 및 DB 삭제가 완료되어야 한다', async () => {
      const response = await request(app)
        .delete(`/api/issues/delete/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const checkIssue = await prisma.issue.findUnique({ where: { id: targetIssueId } });
      expect(checkIssue).toBeNull();
    });

    it('존재하지 않는 이슈 ID 삭제 요청 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .delete('/api/issues/delete/9999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });
});
