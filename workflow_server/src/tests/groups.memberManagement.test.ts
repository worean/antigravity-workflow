// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('👥 [Groups Member Management] add & remove group member Unit Test', () => {
  let authToken: string;
  let adminUser: any;
  let targetMember: any;
  let group: any;

  beforeEach(async () => {
    const testPassword = 'Password123!';
    adminUser = await prisma.user.create({
      data: {
        email: `admin_mgr_${Date.now()}_${Math.random()}@example.com`,
        name: 'Admin Manager',
        password: testPassword,
        role: 'ADMIN',
      },
    });

    targetMember = await prisma.user.create({
      data: {
        email: `member_user_${Date.now()}_${Math.random()}@example.com`,
        name: 'Target Member',
        password: testPassword,
        role: 'MEMBER',
      },
    });

    group = await prisma.group.create({
      data: {
        name: `코어엔지니어링_${Date.now()}`,
        code: `CORE_${Date.now()}`,
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: testPassword });

    authToken = res.body.token;
  });


  it('1️⃣ 그룹에 멤버 추가 및 직책/LEADER 역할 부여 성공', async () => {
    const res = await request(app)
      .post(`/api/groups/${group.id}/members`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId: targetMember.id,
        role: 'LEADER',
        title: '수석 엔지니어',
      });

    expect(res.status).toBe(201);
    expect(res.body.groupId).toBe(group.id);
    expect(res.body.userId).toBe(targetMember.id);
    expect(res.body.role).toBe('LEADER');
    expect(res.body.title).toBe('수석 엔지니어');
  });

  it('2️⃣ 그룹에서 멤버 제거 성공', async () => {
    // 먼저 멤버 추가
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: targetMember.id,
        role: 'MEMBER',
      },
    });

    const res = await request(app)
      .delete(`/api/groups/${group.id}/members/${targetMember.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('successfully removed');

    const check = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: targetMember.id,
        },
      },
    });
    expect(check).toBeNull();
  });
});
