import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';
import { updateIssueService } from '../modules/issues/services/updateIssue.service.js';
import { deleteIssueService } from '../modules/issues/services/deleteIssue.service.js';
import { getIssueService } from '../modules/issues/services/getIssue.service.js';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';

describe('🌿 [Issue Parent-Child Date Rollup] Unit Tests', () => {
  let user: any;
  let project: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 9) + Date.now();
    user = await createUserService({
      email: 'sync_dates_user_' + rand + '@test.com',
      name: 'Date Sync Tester',
      password: 'password123'
    });

    project = await createProjectService(
      {
        name: 'Date Sync Project',
        key: ('DATESYNC_' + rand).substring(0, 20).toUpperCase(),
        description: 'Test project for parent date rollup'
      },
      user.id
    );
  });

  it('1. 하위 이슈가 생성되면 상위 이슈의 plannedStartDate, dueDate가 하위 이슈의 일정으로 자동 갱신되어야 합니다.', async () => {
    // 1) 상위 이슈 생성 (초기 날짜: 2026-05-01 ~ 2026-05-31)
    const parent = await createIssueService(
      {
        title: '상위 이슈 1',
        projectId: project.id,
        plannedStartDate: '2026-05-01',
        dueDate: '2026-05-31'
      },
      user.id
    );

    // 2) 하위 이슈 생성 (일정: 2026-06-10 ~ 2026-06-20)
    await createIssueService(
      {
        title: '하위 이슈 1-1',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-06-10',
        dueDate: '2026-06-20'
      },
      user.id
    );

    // 3) 상위 이슈 DB 조회 - 기존 사용자가 설정했던 5월 날짜와 무관하게 하위 이슈 날짜(6월 10일 ~ 6월 20일)로 자동 수정되어야 함
    const updatedParent = await getIssueService(parent.id, user.id);
    expect(new Date(updatedParent.plannedStartDate!).toISOString()).toBe('2026-06-10T00:00:00.000Z');
    expect(new Date(updatedParent.dueDate!).toISOString()).toBe('2026-06-20T00:00:00.000Z');
  });

  it('2. 복수의 하위 이슈가 존재할 때, 시작계획일의 최소값과 기한의 최대값으로 상위 이슈 날짜가 계산되어야 합니다.', async () => {
    const parent = await createIssueService(
      {
        title: '상위 이슈 2',
        projectId: project.id
      },
      user.id
    );

    // 자식 1: 2026-07-05 ~ 2026-07-15
    await createIssueService(
      {
        title: '자식 1',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-07-05',
        dueDate: '2026-07-15'
      },
      user.id
    );

    // 자식 2: 2026-07-01 ~ 2026-07-10 (더 빠른 시작일)
    await createIssueService(
      {
        title: '자식 2',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-07-01',
        dueDate: '2026-07-10'
      },
      user.id
    );

    // 자식 3: 2026-07-10 ~ 2026-07-25 (더 늦은 기한)
    await createIssueService(
      {
        title: '자식 3',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-07-10',
        dueDate: '2026-07-25'
      },
      user.id
    );

    const updatedParent = await getIssueService(parent.id, user.id);
    expect(new Date(updatedParent.plannedStartDate!).toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(new Date(updatedParent.dueDate!).toISOString()).toBe('2026-07-25T00:00:00.000Z');
  });

  it('3. 하위 이슈의 일정이 수정되면 상위 이슈의 날짜가 자동으로 재계산되어야 합니다.', async () => {
    const parent = await createIssueService({ title: '상위 이슈 3', projectId: project.id }, user.id);

    const child = await createIssueService(
      {
        title: '하위 이슈 3-1',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-08-01',
        dueDate: '2026-08-10'
      },
      user.id
    );

    // 자식 일정 변경: 2026-08-05 ~ 2026-08-30
    await updateIssueService(child.id, {
      userId: user.id,
      plannedStartDate: '2026-08-05',
      dueDate: '2026-08-30'
    });

    const updatedParent = await getIssueService(parent.id, user.id);
    expect(new Date(updatedParent.plannedStartDate!).toISOString()).toBe('2026-08-05T00:00:00.000Z');
    expect(new Date(updatedParent.dueDate!).toISOString()).toBe('2026-08-30T00:00:00.000Z');
  });

  it('4. 하위 이슈의 상위 이슈가 변경되면 이전 상위 이슈와 새 상위 이슈 모두 일정이 갱신되어야 합니다.', async () => {
    const parentA = await createIssueService({ title: '부모 A', projectId: project.id }, user.id);
    const parentB = await createIssueService({ title: '부모 B', projectId: project.id }, user.id);

    const childA1 = await createIssueService(
      { title: 'A 자식 1', projectId: project.id, parentId: parentA.id, plannedStartDate: '2026-09-01', dueDate: '2026-09-10' },
      user.id
    );
    const childMoving = await createIssueService(
      { title: '이동할 자식', projectId: project.id, parentId: parentA.id, plannedStartDate: '2026-08-15', dueDate: '2026-09-30' },
      user.id
    );

    // 이동 전 parentA는 2026-08-15 ~ 2026-09-30
    let fetchedA = await getIssueService(parentA.id, user.id);
    expect(new Date(fetchedA.plannedStartDate!).toISOString()).toBe('2026-08-15T00:00:00.000Z');
    expect(new Date(fetchedA.dueDate!).toISOString()).toBe('2026-09-30T00:00:00.000Z');

    // childMoving의 부모를 parentB로 변경
    await updateIssueService(childMoving.id, {
      userId: user.id,
      parentId: parentB.id
    });

    // parentA는 이제 childA1(2026-09-01 ~ 2026-09-10)만 남음
    fetchedA = await getIssueService(parentA.id, user.id);
    expect(new Date(fetchedA.plannedStartDate!).toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(new Date(fetchedA.dueDate!).toISOString()).toBe('2026-09-10T00:00:00.000Z');

    // parentB는 childMoving(2026-08-15 ~ 2026-09-30)의 일정을 반영
    const fetchedB = await getIssueService(parentB.id, user.id);
    expect(new Date(fetchedB.plannedStartDate!).toISOString()).toBe('2026-08-15T00:00:00.000Z');
    expect(new Date(fetchedB.dueDate!).toISOString()).toBe('2026-09-30T00:00:00.000Z');
  });

  it('5. 하위 이슈가 삭제되면 상위 이슈의 날짜가 남은 하위 이슈 기준으로 재계산되어야 합니다.', async () => {
    const parent = await createIssueService({ title: '상위 이슈 5', projectId: project.id }, user.id);

    const child1 = await createIssueService(
      { title: '자식 1', projectId: project.id, parentId: parent.id, plannedStartDate: '2026-10-01', dueDate: '2026-10-10' },
      user.id
    );
    const child2 = await createIssueService(
      { title: '자식 2 (삭제될 대상)', projectId: project.id, parentId: parent.id, plannedStartDate: '2026-09-01', dueDate: '2026-10-31' },
      user.id
    );

    // 삭제 전: 2026-09-01 ~ 2026-10-31
    let fetchedParent = await getIssueService(parent.id, user.id);
    expect(new Date(fetchedParent.plannedStartDate!).toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(new Date(fetchedParent.dueDate!).toISOString()).toBe('2026-10-31T00:00:00.000Z');

    // child2 삭제
    await deleteIssueService(child2.id, user.id);

    // 삭제 후: child1 일정(2026-10-01 ~ 2026-10-10)으로 재계산
    fetchedParent = await getIssueService(parent.id, user.id);
    expect(new Date(fetchedParent.plannedStartDate!).toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(new Date(fetchedParent.dueDate!).toISOString()).toBe('2026-10-10T00:00:00.000Z');
  });

  it('6. 3단계 이상의 다단계 계층(Grandparent -> Parent -> Child)에서도 루트 조상까지 연쇄적으로 날짜가 동기화되어야 합니다.', async () => {
    const grandParent = await createIssueService({ title: '조부모 이슈 (Root)', projectId: project.id }, user.id);
    const parent = await createIssueService({ title: '부모 이슈', projectId: project.id, parentId: grandParent.id }, user.id);

    // 자식 이슈 등록
    await createIssueService(
      {
        title: '손자 이슈',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-11-10',
        dueDate: '2026-11-20'
      },
      user.id
    );

    const fetchedParent = await getIssueService(parent.id, user.id);
    const fetchedGrandParent = await getIssueService(grandParent.id, user.id);

    expect(new Date(fetchedParent.plannedStartDate!).toISOString()).toBe('2026-11-10T00:00:00.000Z');
    expect(new Date(fetchedParent.dueDate!).toISOString()).toBe('2026-11-20T00:00:00.000Z');

    expect(new Date(fetchedGrandParent.plannedStartDate!).toISOString()).toBe('2026-11-10T00:00:00.000Z');
    expect(new Date(fetchedGrandParent.dueDate!).toISOString()).toBe('2026-11-20T00:00:00.000Z');
  });

  it('7. 하위 이슈가 있는 상위 이슈에 사용자가 직접 updateIssue로 다른 날짜를 지정해도, 하위 이슈 일정으로 자동 보정되어야 합니다.', async () => {
    const parent = await createIssueService({ title: '상위 이슈 7', projectId: project.id }, user.id);

    await createIssueService(
      {
        title: '하위 이슈 7-1',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-12-01',
        dueDate: '2026-12-15'
      },
      user.id
    );

    // 사용자가 상위 이슈의 날짜를 2026-01-01 ~ 2026-01-31 로 강제 수정 시도
    const updated = await updateIssueService(parent.id, {
      userId: user.id,
      plannedStartDate: '2026-01-01',
      dueDate: '2026-01-31'
    });

    // 하위 이슈가 존재하므로 하위 이슈의 일정(2026-12-01 ~ 2026-12-15)으로 유지/보정되어야 함
    expect(new Date(updated.plannedStartDate!).toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(new Date(updated.dueDate!).toISOString()).toBe('2026-12-15T00:00:00.000Z');
  });

  it('8. 실제시작일(actualStartDate), 실제종료일(actualEndDate)은 상위 이슈로 자동 롤업되지 않고 독립적으로 유지되어야 합니다.', async () => {
    const parent = await createIssueService(
      {
        title: '상위 이슈 8',
        projectId: project.id,
        actualStartDate: '2026-02-01',
        actualEndDate: '2026-02-28'
      },
      user.id
    );

    await createIssueService(
      {
        title: '하위 이슈 8-1',
        projectId: project.id,
        parentId: parent.id,
        plannedStartDate: '2026-03-01',
        dueDate: '2026-03-15',
        actualStartDate: '2026-03-02',
        actualEndDate: '2026-03-14'
      },
      user.id
    );

    const fetchedParent = await getIssueService(parent.id, user.id);

    // 시작계획일/기한은 하위 이슈 기준으로 롤업
    expect(new Date(fetchedParent.plannedStartDate!).toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(new Date(fetchedParent.dueDate!).toISOString()).toBe('2026-03-15T00:00:00.000Z');

    // 실제시작일/실제종료일은 상위 이슈 고유의 값이 그대로 유지되어야 함
    expect(new Date(fetchedParent.actualStartDate!).toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(new Date(fetchedParent.actualEndDate!).toISOString()).toBe('2026-02-28T00:00:00.000Z');
  });
});