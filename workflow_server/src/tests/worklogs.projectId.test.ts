import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { getWorklogsService } from '../modules/worklogs/services/getWorklogs.service.js';
import { createWorklogService } from '../modules/worklogs/services/createWorklog.service.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('⏱️ [Worklogs: ProjectId Filter Query] Unit Tests', () => {
  let testUser: any;
  let projectA: any;
  let projectB: any;
  let issueA1: any;
  let issueA2: any;
  let issueB1: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 8) + Date.now();

    testUser = await prisma.user.create({
      data: {
        email: `worklog_user_${rand}@test.com`,
        name: `WorklogUser_${rand}`,
        password: 'password123',
      },
    });

    projectA = await prisma.project.create({
      data: {
        name: `프로젝트A_${rand}`,
        key: `PA_${rand.substring(0, 4).toUpperCase()}`,
        ownerId: testUser.id,
      },
    });

    projectB = await prisma.project.create({
      data: {
        name: `프로젝트B_${rand}`,
        key: `PB_${rand.substring(0, 4).toUpperCase()}`,
        ownerId: testUser.id,
      },
    });

    issueA1 = await createIssueService(
      { title: '프로젝트A 이슈 1', projectId: projectA.id },
      testUser.id
    );
    issueA2 = await createIssueService(
      { title: '프로젝트A 이슈 2', projectId: projectA.id },
      testUser.id
    );
    issueB1 = await createIssueService(
      { title: '프로젝트B 이슈 1', projectId: projectB.id },
      testUser.id
    );

    // 프로젝트 A에 작업로그 2개 생성
    await createWorklogService(issueA1.id, {
      userId: testUser.id,
      timeSpent: 60,
      description: 'A1 1시간 작업',
    });
    await createWorklogService(issueA2.id, {
      userId: testUser.id,
      timeSpent: 90,
      description: 'A2 1.5시간 작업',
    });

    // 프로젝트 B에 작업로그 1개 생성
    await createWorklogService(issueB1.id, {
      userId: testUser.id,
      timeSpent: 30,
      description: 'B1 30분 작업',
    });
  });

  it('1. projectId를 전달하면 해당 프로젝트에 속한 이슈의 작업로그만 반환되어야 한다', async () => {
    const logsA = await getWorklogsService({ projectId: projectA.id });
    expect(logsA.length).toBe(2);
    expect(logsA.every((l) => l.issue.projectId === projectA.id)).toBe(true);

    const logsB = await getWorklogsService({ projectId: projectB.id });
    expect(logsB.length).toBe(1);
    expect(logsB[0].issue.projectId === projectB.id);
  });

  it('2. 특정 issueId와 projectId를 함께 전달해도 정상 필터링되어야 한다', async () => {
    const logsA1 = await getWorklogsService({
      projectId: projectA.id,
      issueId: issueA1.id,
    });
    expect(logsA1.length).toBe(1);
    expect(logsA1[0].issueId).toBe(issueA1.id);
  });
});
