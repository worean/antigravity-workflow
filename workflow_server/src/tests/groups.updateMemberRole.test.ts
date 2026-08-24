// -*- coding: utf-8 -*-
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import jwt from 'jsonwebtoken';

describe('🏢 [Groups: updateMemberRole] 그룹 내부 권한 (PM, 개발자, 리뷰어) 설정 단위 테스트', () => {
  let testUser: any;
  let testToken: string;
  let testGroup: any;

  beforeAll(async () => {
    // 1. 테스트 유저 생성
    const uniqueEmail = `group_role_test_${Date.now()}@example.com`;
    testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: '그룹 멤버 권한 테스트 유저',
        role: 'MEMBER',
      },
    });

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    testToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 2. 테스트 그룹 생성
    testGroup = await prisma.group.create({
      data: {
        name: '프론트엔드 파트',
        code: `FE_PART_${Date.now()}`,
      },
    });

    // 3. 멤버 초기 추가 (기본: MEMBER)
    await prisma.groupMember.create({
      data: {
        groupId: testGroup.id,
        userId: testUser.id,
        role: 'MEMBER',
        title: '주니어 개발자',
      },
    });
  });

  afterAll(async () => {
    if (testUser) {
      await prisma.groupMember.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    if (testGroup) {
      await prisma.group.delete({ where: { id: testGroup.id } }).catch(() => {});
    }
  });

  it('1️⃣ 그룹 내 권한을 1. 관리자(PM - ADMIN)로 변경할 수 있어야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/${testUser.id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ role: 'ADMIN', title: '프로젝트 PM / 파트장' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('ADMIN');
    expect(res.body.title).toBe('프로젝트 PM / 파트장');
    expect(res.body.groupId).toBe(testGroup.id);
    expect(res.body.userId).toBe(testUser.id);
  });

  it('2️⃣ 그룹 내 권한을 2. 담당자(개발자 - MEMBER)로 변경할 수 있어야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/${testUser.id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ role: 'MEMBER', title: '프론트엔드 시니어 개발자' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('MEMBER');
    expect(res.body.title).toBe('프론트엔드 시니어 개발자');
  });

  it('3️⃣ 그룹 내 권한을 3. 참석자(리뷰어 - VIEWER)로 변경할 수 있어야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/${testUser.id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ role: 'VIEWER', title: '코드 리뷰어' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('VIEWER');
    expect(res.body.title).toBe('코드 리뷰어');
  });

  it('4️⃣ 존재하지 않는 그룹 멤버에 대해 수정 요청 시 400 에러를 반환해야 한다', async () => {
    const res = await request(app)
      .put(`/api/groups/${testGroup.id}/members/999999`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not found');
  });
});
