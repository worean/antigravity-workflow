/**
 * 🧪 [Domain: sprints / Service: assignIssuesAndDates]
 * - 기능: 스프린트 이슈 할당/해제 및 이슈 일정 기반 시작일/기한 자동 계산 단위/API 테스트
 * - 경우의 수:
 *   1) 스프린트에 이슈 할당 시 이슈들의 min(plannedStartDate), max(dueDate)로 스프린트 일정 자동 계산 검증
 *   2) 추가 이슈 할당 시 스프린트 종료일이 최신 최댓값으로 자동 확장되는지 검증
 *   3) 이슈 제외 시 스프린트 시작일이 남은 이슈들의 최솟값으로 재계산되는지 검증
 *   4) 스프린트 삭제 시 속한 이슈들이 백로그(sprintId: null)로 안전하게 복귀하는지 검증
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🧪 [sprints.assignIssuesAndDates] Unit & REST API Tests', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: any;
  let authToken: string;
  let testProject: any;
  let issue1: any;
  let issue2: any;
  let issue3: any;
  let testSprintId: number;

  beforeAll(async () => {
    testUser = await prisma.user.upsert({
      where: { email: 'sprint-dates-tester@example.com' },
      update: {},
      create: { email: 'sprint-dates-tester@example.com', name: 'Sprint Tester' }
    });
    authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, jwtSecret, { expiresIn: '1h' });

    let status = await prisma.projectStatus.findFirst();
    if (!status) status = await prisma.projectStatus.create({ data: { name: 'Active', category: 'IN_PROGRESS' } });
    let priority = await prisma.projectPriority.findFirst();
    if (!priority) priority = await prisma.projectPriority.create({ data: { name: 'Medium', level: 2 } });

    testProject = await prisma.project.create({
      data: {
        name: 'Sprint Dates Project',
        key: `SDP_${Date.now()}`,
        ownerId: testUser.id,
        statusId: status.id,
        priorityId: priority.id
      }
    });

    // Issue 1: 2026-09-01 ~ 2026-09-05
    issue1 = await createIssueService({
      title: 'Sprint Issue 1',
      projectId: testProject.id,
      authorId: testUser.id,
      plannedStartDate: '2026-09-01T00:00:00.000Z',
      dueDate: '2026-09-05T00:00:00.000Z'
    });

    // Issue 2: 2026-08-28 ~ 2026-09-10 (가장 빠른 시작일)
    issue2 = await createIssueService({
      title: 'Sprint Issue 2',
      projectId: testProject.id,
      authorId: testUser.id,
      plannedStartDate: '2026-08-28T00:00:00.000Z',
      dueDate: '2026-09-10T00:00:00.000Z'
    });

    // Issue 3: 2026-09-03 ~ 2026-09-15 (가장 늦은 마감일)
    issue3 = await createIssueService({
      title: 'Sprint Issue 3',
      projectId: testProject.id,
      authorId: testUser.id,
      plannedStartDate: '2026-09-03T00:00:00.000Z',
      dueDate: '2026-09-15T00:00:00.000Z'
    });
  });

  afterAll(async () => {
    if (testSprintId) await prisma.sprint.delete({ where: { id: testSprintId } }).catch(() => {});
    await prisma.issue.deleteMany({ where: { projectId: testProject?.id } }).catch(() => {});
    if (testProject) await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    if (testUser) await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
  });

  it('Step 1: 날짜 없이 스프린트를 생성한다', async () => {
    const res = await request(app)
      .post('/api/sprints')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Auto Date Sprint',
        goal: 'Test auto calculating sprint dates from issues',
        projectId: testProject.id
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Auto Date Sprint');
    testSprintId = res.body.id;
  });

  it('Step 2: Issue 1, 2를 할당하면 스프린트 시작일이 08-28, 종료일이 09-10으로 자동 계산된다', async () => {
    const res = await request(app)
      .post(`/api/sprints/${testSprintId}/issues`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        addIssueIds: [issue1.id, issue2.id],
        autoCalculateDates: true
      });

    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(2);
    expect(new Date(res.body.startDate).toISOString().slice(0, 10)).toBe('2026-08-28');
    expect(new Date(res.body.endDate).toISOString().slice(0, 10)).toBe('2026-09-10');
  });

  it('Step 3: Issue 3을 추가 할당하면 종료일이 09-15로 자동 확장된다', async () => {
    const res = await request(app)
      .post(`/api/sprints/${testSprintId}/issues`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        addIssueIds: [issue3.id],
        autoCalculateDates: true
      });

    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(3);
    expect(new Date(res.body.startDate).toISOString().slice(0, 10)).toBe('2026-08-28');
    expect(new Date(res.body.endDate).toISOString().slice(0, 10)).toBe('2026-09-15');
  });

  it('Step 4: Issue 2(08-28 시작)를 제외하면 시작일이 남은 이슈들의 최솟값(09-01)으로 재계산된다', async () => {
    const res = await request(app)
      .post(`/api/sprints/${testSprintId}/issues`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        removeIssueIds: [issue2.id],
        autoCalculateDates: true
      });

    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(2);
    expect(new Date(res.body.startDate).toISOString().slice(0, 10)).toBe('2026-09-01');
    expect(new Date(res.body.endDate).toISOString().slice(0, 10)).toBe('2026-09-15');
  });

  it('Step 5: 스프린트를 삭제하면 속한 이슈들의 sprintId가 null로 안전하게 초기화된다', async () => {
    const delRes = await request(app)
      .delete(`/api/sprints/${testSprintId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(delRes.status).toBe(200);

    const checkIssue1 = await prisma.issue.findUnique({ where: { id: issue1.id } });
    const checkIssue3 = await prisma.issue.findUnique({ where: { id: issue3.id } });
    expect(checkIssue1?.sprintId).toBeNull();
    expect(checkIssue3?.sprintId).toBeNull();
  });
});