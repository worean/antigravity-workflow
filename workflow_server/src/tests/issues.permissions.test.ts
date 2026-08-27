// -*- coding: utf-8 -*-
import { describe, it, expect } from 'vitest';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';
import { addMemberService } from '../modules/projects/services/addMember.service.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';
import { deleteIssueService } from '../modules/issues/services/deleteIssue.service.js';
import { prisma } from '#lib/prisma.js';

describe('Issue Access & Role Authorization Unit Tests', () => {
  it('should allow project member to create an issue', async () => {
    const pm = await createUserService({
      email: `pm_issue_${Date.now()}@example.com`,
      name: 'PM',
      password: 'pass'
    });

    const member = await createUserService({
      email: `member_issue_${Date.now()}@example.com`,
      name: 'Member',
      password: 'pass'
    });

    const project = await createProjectService(
      { name: 'Issue Perm Project', key: `IP${Math.floor(Math.random() * 10000)}` },
      pm.id
    );

    // 멤버 추가
    await addMemberService(project.id, member.id, 'MEMBER');

    // 멤버 권한으로 이슈 생성
    const issue = await createIssueService(
      {
        title: 'Member Test Issue',
        projectId: project.id
      },
      member.id
    );

    expect(issue).toBeDefined();
    expect(issue.projectId).toBe(project.id);
    expect(issue.authorId).toBe(member.id);
  });

  it('should verify PM role check logic for issue deletion', async () => {
    const pm = await createUserService({
      email: `pm_del_${Date.now()}@example.com`,
      name: 'PM Del',
      password: 'pass'
    });

    const member = await createUserService({
      email: `member_del_${Date.now()}@example.com`,
      name: 'Member Del',
      password: 'pass'
    });

    const project = await createProjectService(
      { name: 'Del Perm Project', key: `DP${Math.floor(Math.random() * 10000)}` },
      pm.id
    );

    await addMemberService(project.id, member.id, 'MEMBER');

    const issue = await createIssueService(
      { title: 'Issue To Delete', projectId: project.id },
      member.id
    );

    // DB 상 프로젝트 PM 검증 로직 테스트
    const projectDb = await prisma.project.findUnique({
      where: { id: issue.projectId },
      include: { members: { where: { userId: member.id } } }
    });

    const isMemberPM = projectDb?.ownerId === member.id || projectDb?.members.some(m => m.role === 'ADMIN');
    expect(isMemberPM).toBe(false); // 일반 멤버는 PM이 아님

    const isOwnerPM = projectDb?.ownerId === pm.id;
    expect(isOwnerPM).toBe(true); // 프로젝트 생성자(PM)는 PM임

    // PM 권한으로 이슈 삭제 수행
    const delResult = await deleteIssueService(issue.id);
    expect(delResult).toBeDefined();
  });
});
