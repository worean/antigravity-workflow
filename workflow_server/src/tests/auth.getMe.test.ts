import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import jwt from 'jsonwebtoken';

describe('🔐 [Auth: getMe] 사용자 프로필 및 소속 그룹 조회 테스트', () => {
  let testUser: any;
  let testToken: string;
  let parentGroup: any;
  let childGroup: any;

  beforeAll(async () => {
    // 테스트 유저 생성
    const uniqueEmail = `getme_test_${Date.now()}@example.com`;
    testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: '홍길동 수석연구원',
        role: 'MEMBER',
      },
    });

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    testToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 상위 및 하위 그룹 생성
    parentGroup = await prisma.group.create({
      data: {
        name: '기술연구소',
        code: `RND_${Date.now()}`,
        description: '사내 핵심 기술 연구 및 아키텍처 수립',
      },
    });

    childGroup = await prisma.group.create({
      data: {
        name: '플랫폼개발팀',
        code: `DEV_PLAT_${Date.now()}`,
        description: '워크플로우 플랫폼 및 백엔드 시스템 개발',
        parentId: parentGroup.id,
      },
    });

    // 유저를 하위 그룹에 멤버로 등록 (직책: 수석연구원, 역할: LEADER)
    await prisma.groupMember.create({
      data: {
        groupId: childGroup.id,
        userId: testUser.id,
        role: 'LEADER',
        title: '플랫폼 테크리드 / 수석연구원',
      },
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testUser) {
      await prisma.groupMember.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    if (childGroup) {
      await prisma.group.delete({ where: { id: childGroup.id } }).catch(() => {});
    }
    if (parentGroup) {
      await prisma.group.delete({ where: { id: parentGroup.id } }).catch(() => {});
    }
  });

  it('1️⃣ 인증 토큰으로 GET /api/auth/me 호출 시 소속 그룹 및 상위 그룹 계층 정보가 함께 반환되어야 한다', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(testUser.id);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe('홍길동 수석연구원');

    // groupMemberships 검증
    expect(Array.isArray(res.body.user.groupMemberships)).toBe(true);
    expect(res.body.user.groupMemberships.length).toBe(1);

    const membership = res.body.user.groupMemberships[0];
    expect(membership.role).toBe('LEADER');
    expect(membership.title).toBe('플랫폼 테크리드 / 수석연구원');
    expect(membership.group).toBeDefined();
    expect(membership.group.id).toBe(childGroup.id);
    expect(membership.group.name).toBe('플랫폼개발팀');
    expect(membership.group.parent).toBeDefined();
    expect(membership.group.parent.id).toBe(parentGroup.id);
    expect(membership.group.parent.name).toBe('기술연구소');
  });

  it('2️⃣ 인증 토큰 없이 GET /api/auth/me 호출 시 401 Unauthorized 에러를 반환해야 한다', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('3️⃣ GET /api/users/:id 호출 시에도 소속 그룹 정보가 포함되어야 한다', async () => {
    const res = await request(app)
      .get(`/api/users/${testUser.id}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testUser.id);
    expect(res.body.groupMemberships).toBeDefined();
    expect(res.body.groupMemberships.length).toBe(1);
    expect(res.body.groupMemberships[0].group.name).toBe('플랫폼개발팀');
  });
});
