// -*- coding: utf-8 -*-
/**
 * 🧪 [Domain: issues / Service: updateIssue]
 * - 기능: 이슈 정보(제목, 내용, 진척도 등) 수정 REST API 단위 테스트
 * - 경우의 수: 이슈 정보 변경 성공 (200 OK), 존재하지 않는 이슈 ID 수정 요청 예외 (404/400 Bad Request)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [issues.updateIssue] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let targetIssueId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'update-issue-user@example.com' },
      update: {},
      create: { email: 'update-issue-user@example.com', name: 'UpdateIssue User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Update Issue Test Project',
        key: `UITP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    const issue = await createIssueService({ title: 'Before Update Title', projectId: testProject.id, authorId: testUser.id });
    targetIssueId = issue.id;
  });

  afterAll(async () => {
    await prisma.issue.delete({ where: { id: targetIssueId } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: ✏️ 이슈 정보 수정 기능', () => {
    it('이슈 제목 수정 성공 시 변경된 이슈 정보가 반환되어야 한다', async () => {
      const response = await request(app)
        .put(`/api/issues/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'After Update Title' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'After Update Title');
    });

    it('이슈 상태(statusId) 수정 요청 시 상태 변경이 성공해야 한다', async () => {
      let nextStatus = await prisma.issueStatus.findFirst({ where: { name: 'IN_PROGRESS' } });
      if (!nextStatus) {
        nextStatus = await prisma.issueStatus.create({ data: { name: 'IN_PROGRESS', category: 'IN_PROGRESS' } });
      }

      const response = await request(app)
        .put(`/api/issues/${targetIssueId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ statusId: nextStatus.id });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('statusId', nextStatus.id);
    });

    it('존재하지 않는 이슈 ID 수정 요청 시 404/400 Error를 반환해야 한다', async () => {
      const response = await request(app)
        .put('/api/issues/9999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Ghost Title' });

      expect([400, 404]).toContain(response.status);
    });
  });
});
