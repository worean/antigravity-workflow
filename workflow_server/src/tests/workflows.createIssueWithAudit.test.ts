// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createIssueWithAuditWorkflow } from '../workflows/createIssueWithAudit.workflow.js';

describe('Workflows: createIssueWithAudit', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: `workflow_user_${Date.now()}_${Math.random()}@example.com`,
        password: 'dummy',
        name: 'Workflow Test User'
      }
    });

    testProject = await prisma.project.create({
      data: {
        name: `Workflow Project ${Date.now()}`,
        key: `WP${Math.floor(Math.random() * 1000)}`,
        ownerId: testUser.id
      }
    });
  });

  it('단일 트랜잭션 내에서 이슈 생성 및 감사 로그 적재가 원자적으로 수행되어야 한다', async () => {
    const newIssue = await createIssueWithAuditWorkflow(
      {
        title: '트랜잭션 워크플로우 테스트 이슈',
        description: '다중 도메인 트랜잭션 연동 검증',
        projectId: testProject.id,
        authorId: testUser.id
      },
      testUser.id
    );

    expect(newIssue).toBeDefined();
    expect(newIssue.id).toBeGreaterThan(0);
    expect(newIssue.title).toBe('트랜잭션 워크플로우 테스트 이슈');

    // ActivityLog 도메인에 해당 로그가 정상 적재되었는지 확인
    const logs = await prisma.activityLog.findMany({
      where: {
        entityType: 'ISSUE',
        entityId: newIssue.id,
        action: 'WORKFLOW_CREATE_ISSUE'
      }
    });

    expect(logs.length).toBe(1);
    expect(logs[0].userId).toBe(testUser.id);
    expect(logs[0].summary).toContain('원자적 생성 완료');
  });

  it('트랜잭션 도중 오류 발생 시 이슈와 로그 모두 롤백(All-or-Nothing)되어야 한다', async () => {
    const invalidProjectId = 99999999;

    await expect(
      createIssueWithAuditWorkflow(
        {
          title: '롤백 테스트 이슈',
          projectId: invalidProjectId,
          authorId: testUser.id
        },
        testUser.id
      )
    ).rejects.toThrow();

    // 롤백으로 인해 해당 제목의 이슈가 생성되지 않았는지 확인
    const count = await prisma.issue.count({
      where: { title: '롤백 테스트 이슈' }
    });
    expect(count).toBe(0);
  });
});
