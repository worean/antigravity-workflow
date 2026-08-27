import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import jwt from 'jsonwebtoken';

describe('🏢 [Groups: updateMemberRole] 그룹 내부 권한 (PM, 개발자, 리뷰어) 설정 단위 테스트', () => {
  let adminUser: any;
  let adminToken: string;
  let peerAdminUser: any;
  let normalMemberUser: any;
  let normalMemberToken: string;
  let testGroup: any;

  beforeEach(async () => {
    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';

    // 1. 그룹 관리자 유저 (Group Admin)
    adminUser = await prisma.user.create({
      data: {
        email: `group_admin_${Date.now()}_${Math.random()}@example.com`,
        name: '그룹 관리자',
        role: 'MEMBER',
      },
    });
    adminToken = jwt.sign({ userId: adminUser.id, email: adminUser.email }, jwtSecret, { expiresIn: '1h' });

    // 2. 동료 그룹 관리자 유저 (Peer Admin)
    peerAdminUser = await prisma.user.create({
      data: {
        email: `peer_admin_${Date.now()}_${Math.random()}@example.com`,
        name: '동료 관리자',
        role: 'MEMBER',
      },
    });

    // 3. 일반 그룹 멤버 유저 (Normal Member)
    normalMemberUser = await prisma.user.create({
      data: {
        email: `normal_member_${Date.now()}_${Math.random()}@example.com`,
        name: '일반 팀원',
        role: 'MEMBER',
      },
    });
    normalMemberToken = jwt.sign({ userId: normalMemberUser.id, email: normalMemberUser.email }, jwtSecret, { expiresIn: '1h' });

    // 4. 테스트 그룹 생성
    testGroup = await prisma.group.create({
      data: {
        name: '프론트엔드 파트',
        code: `FE_PART_${Date.now()}_${Math.random()}`,
      },
    });

    // 5. 그룹 멤버 등록
    await prisma.groupMember.createMany({
      data: [
        { groupId: testGroup.id, userId: adminUser.id, role: 'ADMIN', title: '파트장' },
        { groupId: testGroup.id, userId: peerAdminUser.id, role: 'ADMIN', title: '부파트장' },
        { groupId: testGroup.id, userId: normalMemberUser.id, role: 'MEMBER', title: '주니어 개발자' },
      ],
    });
  });

  afterAll(async () => {
    // cleanup
  });

  it('1️⃣ 그룹 관리자가 일반 팀원의 권한을 1. 관리자(ADMIN)로 승격할 수 있어야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/${normalMemberUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN', title: '프로젝트 PM' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('ADMIN');
    expect(res.body.title).toBe('프로젝트 PM');
    expect(res.body.groupId).toBe(testGroup.id);
    expect(res.body.userId).toBe(normalMemberUser.id);
  });

  it('2️⃣ 그룹 관리자가 일반 팀원의 권한을 2. 담당자(MEMBER)로 변경할 수 있어야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/${normalMemberUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'MEMBER', title: '프론트엔드 시니어 개발자' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('MEMBER');
    expect(res.body.title).toBe('프론트엔드 시니어 개발자');
  });

  it('3️⃣ 그룹 관리자가 일반 팀원의 권한을 3. 참석자(VIEWER)로 변경할 수 있어야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/${normalMemberUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'VIEWER', title: '코드 리뷰어' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('VIEWER');
    expect(res.body.title).toBe('코드 리뷰어');
  });

  it('4️⃣ 관리자 본인의 권한을 직접 변경하려고 시도하면 403 Forbidden 에러를 반환해야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/${adminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'MEMBER' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('관리자 본인의 권한은 직접 수정할 수 없습니다');
  });

  it('5️⃣ 다른 그룹 관리자의 권한을 변경하려고 시도하면 403 Forbidden 에러를 반환해야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/${peerAdminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'MEMBER' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('다른 그룹 관리자의 권한은 수정할 수 없습니다');
  });

  it('6️⃣ 일반 팀원이 다른 멤버의 권한을 변경하려고 시도하면 403 Forbidden 에러를 반환해야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/${adminUser.id}`)
      .set('Authorization', `Bearer ${normalMemberToken}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('그룹 관리자 이상만 권한을 수정할 수 있습니다');
  });

  it('7️⃣ 존재하지 않는 그룹 멤버에 대해 수정 요청 시 404 에러를 반환해야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/999999`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });
});
