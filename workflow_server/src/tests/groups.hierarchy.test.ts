// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';

describe('🌳 [Groups Hierarchy] getGroups & tree structure Unit Test', () => {
  let authToken: string;

  beforeEach(async () => {
    const testPassword = 'Password123!';
    const user = await prisma.user.create({
      data: {
        email: `tree_tester_${Date.now()}_${Math.random()}@example.com`,
        name: 'Tree Tester',
        password: testPassword,
        role: 'ADMIN',
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: testPassword });

    authToken = res.body.token;
  });


  it('1️⃣ 루트 그룹 - 서브그룹 - 파트 N계층 트리 조회 성공', async () => {
    const root = await prisma.group.create({
      data: { name: `사업본부_${Date.now()}` },
    });

    const sub = await prisma.group.create({
      data: { name: `서비스기획팀_${Date.now()}`, parentId: root.id },
    });

    const part = await prisma.group.create({
      data: { name: `UI/UX파트_${Date.now()}`, parentId: sub.id },
    });

    const res = await request(app)
      .get('/api/groups?asTree=true')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const foundRoot = res.body.find((g: any) => g.id === root.id);
    expect(foundRoot).toBeDefined();
    expect(foundRoot.childrenList.length).toBeGreaterThan(0);

    const foundSub = foundRoot.childrenList.find((g: any) => g.id === sub.id);
    expect(foundSub).toBeDefined();
    expect(foundSub.childrenList.length).toBeGreaterThan(0);
    expect(foundSub.childrenList[0].id).toBe(part.id);
  });

  it('2️⃣ 자기 자신을 부모로 설정하는 순환 참조 방지', async () => {
    const group = await prisma.group.create({
      data: { name: `독립그룹_${Date.now()}` },
    });

    const res = await request(app)
      .put(`/api/groups/${group.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ parentId: group.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('cannot be its own parent');
  });
});
