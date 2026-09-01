import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import jwt from 'jsonwebtoken';

describe('🔒 [Groups Permissions: Owner & Admin Hierarchy] 오너 단일성 및 권한 계층 단위 테스트', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let sysAdminUser: any;
  let sysAdminToken: string;
  let ownerUser: any;
  let ownerToken: string;
  let adminUser: any;
  let adminToken: string;
  let memberUser: any;
  let group: any;

  beforeEach(async () => {
    sysAdminUser = await prisma.user.create({
      data: {
        email: 'sys_admin_' + Date.now() + '_' + Math.random() + '@example.com',
        name: '시스템 전역 관리자',
        role: 'ADMIN',
      },
    });
    sysAdminToken = jwt.sign({ userId: sysAdminUser.id, email: sysAdminUser.email }, jwtSecret, { expiresIn: '1h' });

    ownerUser = await prisma.user.create({
      data: {
        email: 'group_owner_' + Date.now() + '_' + Math.random() + '@example.com',
        name: '그룹 오너',
        role: 'MEMBER',
      },
    });
    ownerToken = jwt.sign({ userId: ownerUser.id, email: ownerUser.email }, jwtSecret, { expiresIn: '1h' });

    adminUser = await prisma.user.create({
      data: {
        email: 'group_admin_' + Date.now() + '_' + Math.random() + '@example.com',
        name: '그룹 관리자',
        role: 'MEMBER',
      },
    });
    adminToken = jwt.sign({ userId: adminUser.id, email: adminUser.email }, jwtSecret, { expiresIn: '1h' });

    memberUser = await prisma.user.create({
      data: {
        email: 'group_member_' + Date.now() + '_' + Math.random() + '@example.com',
        name: '일반 팀원',
        role: 'MEMBER',
      },
    });

    group = await prisma.group.create({
      data: {
        name: '핵심 개발그룹',
        code: 'DEV_' + Date.now() + '_' + Math.random(),
        members: {
          createMany: {
            data: [
              { userId: ownerUser.id, role: 'OWNER', title: '그룹 오너' },
              { userId: adminUser.id, role: 'ADMIN', title: '그룹 PM' },
              { userId: memberUser.id, role: 'MEMBER', title: '시니어 개발자' },
            ],
          },
        },
      },
    });
  });

  it('1️⃣ 그룹 생성 시 생성자가 자동으로 그룹 OWNER(오너)로 등록되어야 한다', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', 'Bearer ' + ownerToken)
      .send({
        name: '신규 생성 그룹',
        code: 'NEW_GRP_' + Date.now() + '_' + Math.random(),
      });
    expect(res.status).toBe(201);
    const members = res.body.members || [];
    const myMember = members.find((m: any) => m.userId === ownerUser.id);
    expect(myMember).toBeDefined();
    expect(myMember.role).toBe('OWNER');
  });

  it('2️⃣ 그룹 오너(OWNER)는 그룹 내 모든 권한 설정(관리자 임명 및 팀원 변경)이 가능해야 한다', async () => {
    const res = await request(app)
      .put('/api/groups/' + group.id + '/members/' + memberUser.id)
      .set('Authorization', 'Bearer ' + ownerToken)
      .send({ role: 'ADMIN', title: '새로운 부관리자' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('ADMIN');
  });

  it('3️⃣ 그룹 오너(OWNER)가 다른 멤버에게 OWNER 권한을 위임하면 기존 오너는 ADMIN으로 자동 변경(오너 1명 보장)되어야 한다', async () => {
    const res = await request(app)
      .put('/api/groups/' + group.id + '/members/' + adminUser.id)
      .set('Authorization', 'Bearer ' + ownerToken)
      .send({ role: 'OWNER' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('OWNER');

    const oldOwnerMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: ownerUser.id } },
    });
    expect(oldOwnerMember?.role).toBe('ADMIN');

    const totalOwners = await prisma.groupMember.count({
      where: { groupId: group.id, role: 'OWNER' },
    });
    expect(totalOwners).toBe(1);
  });

  it('4️⃣ 그룹 관리자(ADMIN)는 그룹 오너(OWNER)의 권한을 수정할 수 없어야 한다 (403 Forbidden)', async () => {
    const res = await request(app)
      .put('/api/groups/' + group.id + '/members/' + ownerUser.id)
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ role: 'MEMBER' });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('그룹 오너의 권한은 수정할 수 없습니다');
  });

  it('5️⃣ 그룹 관리자(ADMIN)는 다른 멤버를 OWNER로 승격시킬 수 없어야 한다 (403 Forbidden)', async () => {
    const res = await request(app)
      .put('/api/groups/' + group.id + '/members/' + memberUser.id)
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ role: 'OWNER' });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('그룹 오너 권한 위임은 오너 또는 시스템 관리자만 가능합니다');
  });

  it('6️⃣ 그룹 관리자(ADMIN)는 그룹 오너(OWNER)를 그룹에서 제외할 수 없어야 한다 (403 Forbidden)', async () => {
    const res = await request(app)
      .delete('/api/groups/' + group.id + '/members/' + ownerUser.id)
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('그룹 오너는 제외할 수 없습니다');
  });

  it('7️⃣ 시스템 전역 관리자(ADMIN)는 그룹 오너 변경 및 모든 권한 관리가 자유롭게 가능해야 한다', async () => {
    const res = await request(app)
      .put('/api/groups/' + group.id + '/members/' + memberUser.id)
      .set('Authorization', 'Bearer ' + sysAdminToken)
      .send({ role: 'OWNER' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('OWNER');
  });
});