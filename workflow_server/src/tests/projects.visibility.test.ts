﻿import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createUserService } from '../modules/users/services/createUser.service.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';
import { getProjectsService } from '../modules/projects/services/getProjects.service.js';
import { getProjectService } from '../modules/projects/services/getProject.service.js';
import { addMemberService } from '../modules/projects/services/addMember.service.js';
import { addGroupService } from '../modules/projects/services/addGroup.service.js';

describe('Projects: Visibility & Access Control Unit Tests', () => {
  let userA: any; // Project Owner
  let userB: any; // Group Member / Project Member
  let userC: any; // Outsider (Regular User)
  let adminUser: any; // Super Admin

  let publicProj: any;
  let protectedProj: any;
  let privateProj: any;
  let group1: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 8) + Date.now();

    // 1. 유저 생성
    userA = await createUserService({
      email: `owner_${rand}@test.com`,
      name: 'Owner A',
      password: 'password123',
    });

    userB = await createUserService({
      email: `member_${rand}@test.com`,
      name: 'Member B',
      password: 'password123',
    });

    userC = await createUserService({
      email: `outsider_${rand}@test.com`,
      name: 'Outsider C',
      password: 'password123',
    });

    adminUser = await createUserService({
      email: `admin_${rand}@test.com`,
      name: 'Admin User',
      password: 'password123',
      // role: 'ADMIN',
    });

    // 2. 그룹 생성 및 User B 등록
    group1 = await prisma.group.create({
      data: {
        name: `Dev Team ${rand}`,
        code: `DEV_${rand.slice(0, 10).toUpperCase()}`,
        members: {
          create: [{ userId: userB.id, role: 'MEMBER' }],
        },
      },
    });

    // 3. PUBLIC 프로젝트 생성
    publicProj = await createProjectService({
      name: `Public Portal ${rand}`,
      key: `PUB_${rand.slice(0, 8).toUpperCase()}`,
      visibility: 'PUBLIC',
    }, userA.id);

    // 4. PROTECTED 프로젝트 생성 및 group1 연결
    protectedProj = await createProjectService({
      name: `Protected Internal ${rand}`,
      key: `PROT_${rand.slice(0, 8).toUpperCase()}`,
      visibility: 'PROTECTED',
    }, userA.id);

    await addGroupService(protectedProj.id, group1.id, 'MEMBER', userA.id);

    // 5. PRIVATE 프로젝트 생성 및 userB를 개별 멤버로 초대
    privateProj = await createProjectService({
      name: `Private Secret ${rand}`,
      key: `PRIV_${rand.slice(0, 8).toUpperCase()}`,
      visibility: 'PRIVATE',
    }, userA.id);

    await addMemberService(privateProj.id, userB.id, 'MEMBER', userA.id);
  });

  it('1. PUBLIC 프로젝트는 모든 사용자(소유자, 멤버, 외부 유저)가 조회할 수 있어야 합니다.', async () => {
    // User C(외부 유저) 목록 조회
    const userCProjects = await getProjectsService({}, userC.id, 'MEMBER', userC.email);
    expect(userCProjects.some((p: any) => p.id === publicProj.id)).toBe(true);

    // User C 상세 조회
    const detail = await getProjectService(publicProj.id, userC.id, false);
    expect(detail.id).toBe(publicProj.id);
    expect(detail.visibility).toBe('PUBLIC');
  });

  it('2. PROTECTED 프로젝트는 소속 그룹 멤버(User B)는 접근 가능하고, 외부 유저(User C)는 차단되어야 합니다.', async () => {
    // User B(그룹 멤버) 목록 조회 시 노출
    const userBProjects = await getProjectsService({}, userB.id, 'MEMBER', userB.email);
    expect(userBProjects.some((p: any) => p.id === protectedProj.id)).toBe(true);

    // User B 상세 조회 성공
    const detailB = await getProjectService(protectedProj.id, userB.id, false);
    expect(detailB.id).toBe(protectedProj.id);

    // User C(외부 유저) 목록 조회 시 비노출
    const userCProjects = await getProjectsService({}, userC.id, 'MEMBER', userC.email);
    expect(userCProjects.some((p: any) => p.id === protectedProj.id)).toBe(false);

    // User C 상세 조회 시 403 Forbidden 예외 발생
    await expect(getProjectService(protectedProj.id, userC.id, false)).rejects.toThrow(
      /Forbidden: You do not have access to this protected project/
    );
  });

  it('3. PRIVATE 프로젝트는 명시적 멤버(User B)만 접근 가능하고, 외부 유저(User C)는 차단되어야 합니다.', async () => {
    // User B(초대된 멤버) 목록 조회 시 노출
    const userBProjects = await getProjectsService({}, userB.id, 'MEMBER', userB.email);
    expect(userBProjects.some((p: any) => p.id === privateProj.id)).toBe(true);

    // User B 상세 조회 성공
    const detailB = await getProjectService(privateProj.id, userB.id, false);
    expect(detailB.id).toBe(privateProj.id);

    // User C(외부 유저) 목록 조회 시 비노출
    const userCProjects = await getProjectsService({}, userC.id, 'MEMBER', userC.email);
    expect(userCProjects.some((p: any) => p.id === privateProj.id)).toBe(false);

    // User C 상세 조회 시 403 Forbidden 예외 발생
    await expect(getProjectService(privateProj.id, userC.id, false)).rejects.toThrow(
      /Forbidden: You do not have access to this private project/
    );
  });

  it('4. ADMIN 권한 사용자는 PUBLIC, PROTECTED, PRIVATE 모든 프로젝트를 조회할 수 있어야 합니다.', async () => {
    const adminProjects = await getProjectsService({}, adminUser.id, 'ADMIN', adminUser.email);
    expect(adminProjects.some((p: any) => p.id === publicProj.id)).toBe(true);
    expect(adminProjects.some((p: any) => p.id === protectedProj.id)).toBe(true);
    expect(adminProjects.some((p: any) => p.id === privateProj.id)).toBe(true);

    // Admin 상세 조회 모두 성공
    const adminDetail = await getProjectService(privateProj.id, adminUser.id, true);
    expect(adminDetail.id).toBe(privateProj.id);
  });

  it('5. 프로젝트 수정 API를 통해 visibility를 변경할 수 있어야 합니다.', async () => {
    const { updateProjectService } = await import('../modules/projects/services/updateProject.service.js');
    const updated = await updateProjectService(privateProj.id, { visibility: 'PUBLIC' }, userA.id);

    expect(updated.visibility).toBe('PUBLIC');

    // 변경 후 User C(외부 유저)도 조회 가능해야 함
    const userCProjects = await getProjectsService({}, userC.id, 'MEMBER', userC.email);
    expect(userCProjects.some((p: any) => p.id === privateProj.id)).toBe(true);
  });
});
