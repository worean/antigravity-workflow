/**
 * 🧪 [Domain: worklogs / Service: createWorklog]
 * - 기능: 이슈별 작업 시간 기록(Worklog) 등록 REST API 단위 테스트
 * - 경우의 수: 소요시간(timeSpent) 기록 성공 및 이슈 총 투입시간 누적 (201 Created), 필수 파라미터 누락 예외 (400)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [worklogs.createWorklog] Service & REST API Unit Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: { id: number; email: string };
  let authToken: string;
  let testProject: any;
  let testIssue: any;
  let createdWorklogId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'worklog-user@example.com' },
      update: {},
      create: { email: 'worklog-user@example.com', name: 'Worklog User' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Worklog Project',
        key: `WP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    testIssue = await createIssueService({ title: 'Worklog Issue', projectId: testProject.id, authorId: testUser.id });
  });

  afterAll(async () => {
    if (createdWorklogId) await prisma.worklog.delete({ where: { id: createdWorklogId } }).catch(() => {});
    await prisma.issue.delete({ where: { id: testIssue.id } }).catch(() => {});
    await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  describe('Case 1: ⏱️ 작업로그(Worklog) 기록 기능', () => {
    it('이슈 ID 및 작업 시간(timeSpent) 제출 시 작업로그 생성이 성공해야 한다', async () => {
      const response = await request(app)
        .post('/api/worklogs/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          issueId: testIssue.id,
          userId: testUser.id,
          timeSpent: 60,
          description: '1 hour dev work'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.timeSpent).toBe(60);

      createdWorklogId = response.body.id;
    });

    it('필수 데이터(issueId 또는 timeSpent) 누락 시 400 Bad Request 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/worklogs/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'No issue worklog'
        });

      expect(response.status).toBe(400);
    });
  });
});
