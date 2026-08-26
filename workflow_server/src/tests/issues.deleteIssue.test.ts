// -*- coding: utf-8 -*-
/**
 * 🧪 [Domain: issues / Service: deleteIssue]
 * - 기능: 이슈 삭제 REST API 단위 테스트
 * - 경우의 수: 이슈 삭제 성공 (200 OK), 존재하지 않는 이슈 ID 삭제 요청 예외 (404/400 Bad Request)
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
        .delete(`/api/issues/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const checkIssue = await prisma.issue.findUnique({ where: { id: targetIssueId } });
      expect(checkIssue).toBeNull();
    });

    it('존재하지 않는 이슈 ID 삭제 요청 시 404/400 Error를 반환해야 한다', async () => {
      const response = await request(app)
        .delete('/api/issues/9999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404]).toContain(response.status);
    });

    it('상위 이슈가 삭제될 때 하위 이슈들의 parentId가 자신의 상위 이슈 ID(조부모)로 변경되어야 한다', async () => {
      // 1) 조부모 이슈 생성
      const grandParent = await createIssueService({
        title: '조부모 이슈',
        projectId: testProject.id,
        authorId: testUser.id,
      });

      // 2) 중간 부모 이슈 생성 (parentId: grandParent.id)
      const middleParent = await createIssueService({
        title: '중간 부모 이슈',
        projectId: testProject.id,
        parentId: grandParent.id,
        authorId: testUser.id,
      });

      // 3) 자식 이슈 2개 생성 (parentId: middleParent.id)
      const child1 = await createIssueService({
        title: '자식 이슈 1',
        projectId: testProject.id,
        parentId: middleParent.id,
        plannedStartDate: '2026-09-01',
        dueDate: '2026-09-10',
        authorId: testUser.id,
      });

      const child2 = await createIssueService({
        title: '자식 이슈 2',
        projectId: testProject.id,
        parentId: middleParent.id,
        plannedStartDate: '2026-09-05',
        dueDate: '2026-09-20',
        authorId: testUser.id,
      });

      // 4) 중간 부모 이슈 삭제 요청
      const res = await request(app)
        .delete(`/api/issues/${middleParent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // 5) 자식 이슈들의 parentId가 middleParent의 parentId인 grandParent.id로 변경되었는지 확인
      const updatedChild1 = await prisma.issue.findUnique({ where: { id: child1.id } });
      const updatedChild2 = await prisma.issue.findUnique({ where: { id: child2.id } });

      expect(updatedChild1?.parentId).toBe(grandParent.id);
      expect(updatedChild2?.parentId).toBe(grandParent.id);

      // 6) 조부모 이슈의 날짜가 승계된 자식들의 min(2026-09-01), max(2026-09-20)으로 자동 동기화되었는지 확인
      const updatedGrandParent = await prisma.issue.findUnique({ where: { id: grandParent.id } });
      expect(new Date(updatedGrandParent!.plannedStartDate!).toISOString()).toBe('2026-09-01T00:00:00.000Z');
      expect(new Date(updatedGrandParent!.dueDate!).toISOString()).toBe('2026-09-20T00:00:00.000Z');
    });
  });
});
