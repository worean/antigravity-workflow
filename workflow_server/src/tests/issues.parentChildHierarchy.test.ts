import { describe, it, expect } from 'vitest';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';
import { updateIssueService } from '../modules/issues/services/updateIssue.service.js';
import { getIssueService } from '../modules/issues/services/getIssue.service.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';
import { createUserService } from '../modules/users/services/createUser.service.js';

describe('🌿 [Issue Hierarchy & Sub-tasks] Unit Test', () => {
  it('상위 이슈를 지정하여 하위 이슈를 생성할 수 있어야 합니다.', async () => {
    const user = await createUserService({
      email: `hier_user_${Date.now()}@test.com`,
      name: 'Hierarchy User',
      password: 'password123',
    });

    const project = await createProjectService(
      {
        name: 'Hierarchy Project',
        key: `HIER_${Date.now()}`,
        description: 'Test project for hierarchy',
      },
      user.id
    );

    // 1. 상위 이슈 생성 (최상위)
    const parentIssue = await createIssueService(
      {
        title: '상위 메인 이슈 (Main Epic)',
        description: 'Main parent issue description',
        projectId: project.id,
      },
      user.id
    );

    expect(parentIssue.id).toBeDefined();
    expect(parentIssue.parentId).toBeNull();

    // 2. 하위 이슈 생성 (parentId 지정)
    const subIssue1 = await createIssueService(
      {
        title: '하위 서브 태스크 1',
        description: 'Sub task 1 description',
        projectId: project.id,
        parentId: parentIssue.id,
      },
      user.id
    );

    expect(subIssue1.parentId).toBe(parentIssue.id);

    // 3. 상위 이슈 조회 시 children 목록에 subIssue1이 포함되어야 함
    const fetchedParent = await getIssueService(parentIssue.id, user.id);
    expect(fetchedParent.children).toBeDefined();
    expect(fetchedParent.children.length).toBe(1);
    expect(fetchedParent.children[0].id).toBe(subIssue1.id);
  });

  it('기존 이슈의 parentId를 수정하거나 해제할 수 있어야 합니다.', async () => {
    const user = await createUserService({
      email: `hier_user2_${Date.now()}@test.com`,
      name: 'Hierarchy User 2',
      password: 'password123',
    });

    const project = await createProjectService(
      {
        name: 'Hierarchy Project 2',
        key: `HIER2_${Date.now()}`,
      },
      user.id
    );

    const issueA = await createIssueService({ title: '이슈 A', projectId: project.id }, user.id);
    const issueB = await createIssueService({ title: '이슈 B', projectId: project.id }, user.id);

    // B의 상위 이슈로 A 지정
    const updatedB = await updateIssueService(issueB.id, {
      parentId: issueA.id,
      userId: user.id,
    });
    expect(updatedB.parentId).toBe(issueA.id);

    // B의 상위 이슈 해제 (최상위로 변경)
    const detachedB = await updateIssueService(issueB.id, {
      parentId: null,
      userId: user.id,
    });
    expect(detachedB.parentId).toBeNull();
  });

  it('자기 자신을 상위 이슈로 지정할 경우 오류를 반환해야 합니다.', async () => {
    const user = await createUserService({
      email: `hier_user3_${Date.now()}@test.com`,
      name: 'Hierarchy User 3',
      password: 'password123',
    });

    const project = await createProjectService(
      {
        name: 'Hierarchy Project 3',
        key: `HIER3_${Date.now()}`,
      },
      user.id
    );

    const issue = await createIssueService({ title: '단독 이슈', projectId: project.id }, user.id);

    await expect(
      updateIssueService(issue.id, {
        parentId: issue.id,
        userId: user.id,
      })
    ).rejects.toThrow('Cannot set self as parent issue');
  });
});