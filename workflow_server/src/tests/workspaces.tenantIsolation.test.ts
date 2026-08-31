// -*- coding: utf-8 -*-
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';
import { createWorkspaceService } from '../modules/workspaces/services/createWorkspace.service.js';

describe('Multi-Tenant Database URL Dynamic Allocation & E2E Isolation Test', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  let workspaceA: any;
  let workspaceB: any;

  beforeAll(async () => {
    // 1. Global 사용자 A, B 생성
    userA = await globalPrisma.user.upsert({
      where: { email: 'user_a_isolation@example.com' },
      update: {},
      create: { email: 'user_a_isolation@example.com', name: 'User Alpha', role: 'MEMBER' },
    });

    userB = await globalPrisma.user.upsert({
      where: { email: 'user_b_isolation@example.com' },
      update: {},
      create: { email: 'user_b_isolation@example.com', name: 'User Beta', role: 'MEMBER' },
    });

    tokenA = jwt.sign({ userId: userA.id, email: userA.email }, jwtSecret, { expiresIn: '1h' });
    tokenB = jwt.sign({ userId: userB.id, email: userB.email }, jwtSecret, { expiresIn: '1h' });

    // 2. 각각 독립된 워크스페이스 생성 (각각 고유한 dbUrl 자동 할당)
    workspaceA = await createWorkspaceService(userA, { name: 'Alpha Organization' });
    workspaceB = await createWorkspaceService(userB, { name: 'Beta Organization' });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. 사용자 A와 B는 서로 다른 물리적 Database URL을 할당받아야 한다', () => {
    expect(workspaceA.dbUrl).toBeDefined();
    expect(workspaceB.dbUrl).toBeDefined();
    expect(workspaceA.dbUrl).not.toBe(workspaceB.dbUrl);
    expect(workspaceA.dbUrl).toContain('ws_alpha-organization');
    expect(workspaceB.dbUrl).toContain('ws_beta-organization');
  });

  it('2. 사용자 A의 DB 인스턴스에 생성된 프로젝트는 사용자 B의 DB 인스턴스에 존재하지 않아야 한다 (물리 격리)', async () => {
    const dbA = await workspaceManager.getDbClient(workspaceA);
    const dbB = await workspaceManager.getDbClient(workspaceB);

    // DB A에 Project 생성
    const projectA = await dbA.project.create({
      data: {
        name: 'Alpha Confidential Core',
        key: `ALPH_${Date.now()}`,
        ownerId: userA.id,
      },
    });

    // DB B에 Project 생성
    const projectB = await dbB.project.create({
      data: {
        name: 'Beta Top Secret Research',
        key: `BETA_${Date.now()}`,
        ownerId: userB.id,
      },
    });

    // DB A 검증: projectA는 존재하고 projectB는 null이어야 함
    const foundAInA = await dbA.project.findUnique({ where: { id: projectA.id } });
    const foundBInA = await dbA.project.findFirst({ where: { key: projectB.key } });
    expect(foundAInA).toBeDefined();
    expect(foundAInA?.name).toBe('Alpha Confidential Core');
    expect(foundBInA).toBeNull();

    // DB B 검증: projectB는 존재하고 projectA는 null이어야 함
    const foundBInB = await dbB.project.findUnique({ where: { id: projectB.id } });
    const foundAInB = await dbB.project.findFirst({ where: { key: projectA.key } });
    expect(foundBInB).toBeDefined();
    expect(foundBInB?.name).toBe('Beta Top Secret Research');
    expect(foundAInB).toBeNull();
  });

  it('3. 사용자 A가 사용자 B의 워크스페이스(Workspace B)로 API 요청 시 403 Forbidden 차단되어야 한다', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-workspace-id', String(workspaceB.id));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('WORKSPACE_ACCESS_DENIED');
  });
});
