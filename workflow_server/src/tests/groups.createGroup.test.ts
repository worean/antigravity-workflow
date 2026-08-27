// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🏢 [Groups Sub-Service] createGroup Unit & Integration Test', () => {
  let authToken: string;
  let testUser: any;

  beforeEach(async () => {
    const testPassword = 'Password123!';
    testUser = await prisma.user.create({
      data: {
        email: `group_tester_${Date.now()}_${Math.random()}@example.com`,
        name: 'Group Tester',
        password: testPassword,
        role: 'ADMIN',
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testPassword });

    authToken = res.body.token;
  });


  it('1️⃣ 루트 그룹 정상 생성 성공', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '개발본부',
        code: `DEV_${Date.now()}`,
        description: '최상위 개발 본부 조직',
        order: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('개발본부');
    expect(res.body.parentId).toBeNull();
  });

  it('2️⃣ 상위 그룹 ID를 지정하여 서브그룹 생성 성공', async () => {
    const parentGroup = await prisma.group.create({
      data: {
        name: '기술총괄',
        code: `TECH_${Date.now()}`,
      },
    });

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '플랫폼 개발팀',
        code: `PLATFORM_${Date.now()}`,
        parentId: parentGroup.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('플랫폼 개발팀');
    expect(res.body.parentId).toBe(parentGroup.id);
  });

  it('3️⃣ 그룹명이 누락된 경우 400 에러 반환', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Group name is required');
  });

  it('4️⃣ 존재하지 않는 상위 그룹 ID 지정 시 400 에러 반환', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '고아 서브그룹',
        parentId: 99999999,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not found');
  });
});
