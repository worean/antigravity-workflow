// -*- coding: utf-8 -*-
import { describe, it, expect } from 'vitest';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';
import { addMemberService } from '../modules/projects/services/addMember.service.js';
import { prisma } from '#lib/prisma.js';

describe('Project Creation & Member Invitation Unit Tests', () => {
  it('should set creator as Project Owner & PM (ADMIN) automatically', async () => {
    const creator = await createUserService({
      email: `pm_user_${Date.now()}@example.com`,
      name: 'PM User',
      password: 'password123'
    });

    const projectKey = `PRJ${Math.floor(Math.random() * 10000)}`;
    const project = await createProjectService(
      { name: 'PM Test Project', key: projectKey },
      creator.id
    );

    expect(project).toBeDefined();
    expect(project.ownerId).toBe(creator.id);

    // ProjectMember 테이블에 ADMIN 권한으로 등록되었는지 확인
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: creator.id
        }
      }
    });

    expect(member).toBeDefined();
    expect(member?.role).toBe('ADMIN');
  });

  it('should allow PM to invite a new user as MEMBER', async () => {
    const owner = await createUserService({
      email: `owner_${Date.now()}@example.com`,
      name: 'Project Owner',
      password: 'password123'
    });

    const invitee = await createUserService({
      email: `invitee_${Date.now()}@example.com`,
      name: 'Invited Member',
      password: 'password123'
    });

    const projectKey = `INV${Math.floor(Math.random() * 10000)}`;
    const project = await createProjectService(
      { name: 'Invite Test Project', key: projectKey },
      owner.id
    );

    // 멤버 초대
    const memberRecord = await addMemberService(project.id, invitee.id, 'MEMBER');

    expect(memberRecord).toBeDefined();
    expect(memberRecord.projectId).toBe(project.id);
    expect(memberRecord.userId).toBe(invitee.id);
    expect(memberRecord.role).toBe('MEMBER');
  });
});
