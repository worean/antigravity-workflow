import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';
import { getIssueService } from '../modules/issues/services/getIssue.service.js';
import { batchUpdateScheduleService } from '../modules/issues/services/batchUpdateSchedule.service.js';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';

describe('🚀 [Issue Batch Schedule Updates] Unit Tests', () => {
  let user: any;
  let project: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 9) + Date.now();
    user = await createUserService({
      email: 'batch_schedule_' + rand + '@test.com',
      name: 'Batch Schedule Tester',
      password: 'password123'
    });

    project = await createProjectService(
      {
        name: 'Batch Schedule Project',
        key: ('BATCH_' + rand).substring(0, 20).toUpperCase(),
        description: 'Test project for batch schedule updates'
      },
      user.id
    );
  });

  it('1. 빈 배열 전달 시 변경 없이 0건을 반환해야 합니다.', async () => {
    const result = await batchUpdateScheduleService([]);
    expect(result.updatedCount).toBe(0);
    expect(result.issues).toEqual([]);
  });

  it('2. 여러 이슈의 일정을 단일 트랜잭션으로 일괄 수정할 수 있어야 합니다.', async () => {
    const issue1 = await createIssueService(
      {
        title: '이슈 1',
        projectId: project.id,
        plannedStartDate: '2026-06-01',
        dueDate: '2026-06-05'
      },
      user.id
    );

    const issue2 = await createIssueService(
      {
        title: '이슈 2',
        projectId: project.id,
        plannedStartDate: '2026-06-10',
        dueDate: '2026-06-15'
      },
      user.id
    );

    const result = await batchUpdateScheduleService([
      { id: issue1.id, plannedStartDate: '2026-07-01', dueDate: '2026-07-07' },
      { id: issue2.id, plannedStartDate: '2026-07-10', dueDate: '2026-07-20' }
    ]);

    expect(result.updatedCount).toBe(2);

    const fetched1 = await getIssueService(issue1.id, user.id);
    const fetched2 = await getIssueService(issue2.id, user.id);

    expect(new Date(fetched1.plannedStartDate!).toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(new Date(fetched1.dueDate!).toISOString()).toBe('2026-07-07T00:00:00.000Z');
    expect(new Date(fetched2.plannedStartDate!).toISOString()).toBe('2026-07-10T00:00:00.000Z');
    expect(new Date(fetched2.dueDate!).toISOString()).toBe('2026-07-20T00:00:00.000Z');
  });

  it('3. 하위 이슈들을 일괄 수정하면 상위 부모 이슈의 날짜가 자동으로 롤업 동기화되어야 합니다.', async () => {
    const parent = await createIssueService(
      {
        title: '부모 이슈',
        projectId: project.id
      },
      user.id
    );

    const child1 = await createIssueService(
      {
        title: '자식 이슈 1',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-08-01',
        dueDate: '2026-08-10'
      },
      user.id
    );

    const child2 = await createIssueService(
      {
        title: '자식 이슈 2',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-08-05',
        dueDate: '2026-08-20'
      },
      user.id
    );

    // 자식 이슈 2개를 9월로 일괄 이동
    await batchUpdateScheduleService([
      { id: child1.id, plannedStartDate: '2026-09-01', dueDate: '2026-09-15' },
      { id: child2.id, plannedStartDate: '2026-09-10', dueDate: '2026-09-30' }
    ]);

    // 부모 이슈 확인: min(2026-09-01), max(2026-09-30)으로 자동 롤업 동기화
    const updatedParent = await getIssueService(parent.id, user.id);
    expect(new Date(updatedParent.plannedStartDate!).toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(new Date(updatedParent.dueDate!).toISOString()).toBe('2026-09-30T00:00:00.000Z');
  });

  it('4. 유효하지 않은 이슈 ID가 포함된 경우 트랜잭션 전체가 롤백되어야 합니다.', async () => {
    const issue1 = await createIssueService(
      {
        title: '롤백 테스트 이슈 1',
        projectId: project.id,
        plannedStartDate: '2026-10-01',
        dueDate: '2026-10-10'
      },
      user.id
    );

    await expect(
      batchUpdateScheduleService([
        { id: issue1.id, plannedStartDate: '2026-11-01', dueDate: '2026-11-10' },
        { id: 99999999, plannedStartDate: '2026-11-01', dueDate: '2026-11-10' }
      ])
    ).rejects.toThrow();

    // 트랜잭션 롤백으로 인해 issue1은 여전히 10월 날짜를 유지해야 함
    const fetched1 = await getIssueService(issue1.id, user.id);
    expect(new Date(fetched1.plannedStartDate!).toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(new Date(fetched1.dueDate!).toISOString()).toBe('2026-10-10T00:00:00.000Z');
  });
});