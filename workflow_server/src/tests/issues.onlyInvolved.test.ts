import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { getIssuesService } from '../modules/issues/services/getIssues.service.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🎯 [Issues: onlyInvolved Scope Filter] Unit Tests', () => {
  let userA: any;
  let userB: any;
  let projectA: any; // userA 소유
  let projectB: any; // userB 소유
  let issueInProjectA: any;
  let issueInProjectB: any;
  let issueAssignedToAInProjectB: any;
  let issueReportedByAInProjectB: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 8) + Date.now();

    userA = await prisma.user.create({
      data: {
        email: `usera_${rand}@test.com`,
        name: `UserA_${rand}`,
        password: 'password123',
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `userb_${rand}@test.com`,
        name: `UserB_${rand}`,
        password: 'password123',
      },
    });

    projectA = await prisma.project.create({
      data: {
        name: `프로젝트A_${rand}`,
        key: `PA_${rand.substring(0, 4).toUpperCase()}`,
        ownerId: userA.id,
      },
    });

    projectB = await prisma.project.create({
      data: {
        name: `프로젝트B_${rand}`,
        key: `PB_${rand.substring(0, 4).toUpperCase()}`,
        ownerId: userB.id,
      },
    });

    // 1. userA의 프로젝트A 일감 (userA 소속)
    issueInProjectA = await createIssueService(
      { title: 'Project A 일반 이슈', projectId: projectA.id },
      userA.id
    );

    // 2. userB의 프로젝트B 일감 (userA와 아무 관계 없음)
    issueInProjectB = await createIssueService(
      { title: 'Project B 무관한 이슈', projectId: projectB.id },
      userB.id
    );

    // 3. userB의 프로젝트B 일감이지만 userA가 담당자인 일감
    issueAssignedToAInProjectB = await createIssueService(
      { title: 'Project B에서 userA가 담당한 이슈', projectId: projectB.id, assigneeId: userA.id },
      userB.id
    );

    // 4. userB의 프로젝트B 일감이지만 userA가 보고자(작성자)인 일감
    issueReportedByAInProjectB = await createIssueService(
      { title: 'Project B에서 userA가 보고한 이슈', projectId: projectB.id },
      userA.id
    );
  });

  it('1. onlyInvolved=true 설정 시 자신이 속한 프로젝트 또는 담당/보고한 일감만 반환되어야 한다', async () => {
    const result = await getIssuesService({ onlyInvolved: 'true', all: 'true' }, userA.id);
    const issueIds = result.items.map((i: any) => i.id);

    // 1(속한 프로젝트), 3(담당), 4(보고)는 포함되어야 함
    expect(issueIds).toContain(issueInProjectA.id);
    expect(issueIds).toContain(issueAssignedToAInProjectB.id);
    expect(issueIds).toContain(issueReportedByAInProjectB.id);

    // 2(무관한 일감)는 결코 포함되지 않아야 함!
    expect(issueIds).not.toContain(issueInProjectB.id);
  });
});
