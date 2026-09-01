import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';
import { getProjectService } from '../modules/projects/services/getProject.service.js';
import { addMemberService } from '../modules/projects/services/addMember.service.js';
import { removeMemberService } from '../modules/projects/services/removeMember.service.js';
import { updateMemberRoleService } from '../modules/projects/services/updateMemberRole.service.js';
import { addGroupService } from '../modules/projects/services/addGroup.service.js';
import { removeGroupService } from '../modules/projects/services/removeGroup.service.js';
import { updateGroupRoleService } from '../modules/projects/services/updateGroupRole.service.js';

describe('Project Members and Groups Management Tests', () => {
  let ownerUser: any;
  let memberUser: any;
  let testGroup: any;
  let project: any;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    ownerUser = await prisma.user.create({
      data: { email: `owner_${timestamp}@example.com`, name: 'Owner User' },
    });

    memberUser = await prisma.user.create({
      data: { email: `member_${timestamp}@example.com`, name: 'Member User' },
    });

    testGroup = await prisma.group.create({
      data: { name: `Engineering Team ${timestamp}`, code: `ENG_${timestamp}` },
    });

    project = await createProjectService(
      {
        name: `Test Workspace ${timestamp}`,
        key: `TWP_${timestamp}`,
        description: 'Test Workspace Description',
      },
      ownerUser.id
    );
  });

  it('should add, update, and remove individual members in a project', async () => {
    // 1. Add Member
    const member = await addMemberService(project.id, memberUser.id, 'VIEWER', ownerUser.id);
    expect(member.userId).toBe(memberUser.id);
    expect(member.role).toBe('VIEWER');

    // 2. Update Member Role
    const updatedMember = await updateMemberRoleService(project.id, memberUser.id, 'ADMIN', ownerUser.id);
    expect(updatedMember.role).toBe('ADMIN');

    // 3. Verify in getProjectService
    let p = await getProjectService(project.id);
    expect(p.members.some((m: any) => m.userId === memberUser.id && m.role === 'ADMIN')).toBe(true);

    // 4. Remove Member
    const removeRes = await removeMemberService(project.id, memberUser.id, ownerUser.id);
    expect(removeRes.success).toBe(true);

    // 5. Verify removal
    p = await getProjectService(project.id);
    expect(p.members.some((m: any) => m.userId === memberUser.id)).toBe(false);
  });

  it('should add, update, and remove groups in a project', async () => {
    // 1. Add Group
    const pGroup = await addGroupService(project.id, testGroup.id, 'MEMBER', ownerUser.id);
    expect(pGroup.groupId).toBe(testGroup.id);
    expect(pGroup.role).toBe('MEMBER');

    // 2. Update Group Role
    const updatedGroup = await updateGroupRoleService(project.id, testGroup.id, 'ADMIN', ownerUser.id);
    expect(updatedGroup.role).toBe('ADMIN');

    // 3. Verify in getProjectService
    let p = await getProjectService(project.id);
    expect(p.groups.some((g: any) => g.groupId === testGroup.id && g.role === 'ADMIN')).toBe(true);

    // 4. Remove Group
    const removeRes = await removeGroupService(project.id, testGroup.id, ownerUser.id);
    expect(removeRes.success).toBe(true);

    // 5. Verify removal
    p = await getProjectService(project.id);
    expect(p.groups.some((g: any) => g.groupId === testGroup.id)).toBe(false);
  });
});