import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';
import { createWorkspaceService } from '../modules/workspaces/services/createWorkspace.service.js';

describe('Single-Workspace Server Unification & E2E Policy Test (1 Server = 1 Workspace)', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let userA: any;
  let userB: any;
  let tokenA: string;

  let workspaceA: any;
  let workspaceB: any;

  beforeAll(async () => {
    // 1. Global 사용자 A, B 생성
    userA = await globalPrisma.user.upsert({
      where: { email: 'user_a_single_ws@example.com' },
      update: {},
      create: { email: 'user_a_single_ws@example.com', name: 'User Alpha', role: 'MEMBER' },
    });

    userB = await globalPrisma.user.upsert({
      where: { email: 'user_b_single_ws@example.com' },
      update: {},
      create: { email: 'user_b_single_ws@example.com', name: 'User Beta', role: 'MEMBER' },
    });

    await workspaceManager.syncUserToWorkspace(prisma, userA);
    await workspaceManager.syncUserToWorkspace(prisma, userB);

    tokenA = jwt.sign({ userId: userA.id, email: userA.email }, jwtSecret, { expiresIn: '1h' });

    // 2. 단일 워크스페이스 정책: 여러 번 호출해도 서버의 단일 활성 워크스페이스를 반환
    workspaceA = await createWorkspaceService(userA, { name: 'Alpha Organization' });
    workspaceB = await createWorkspaceService(userB, { name: 'Beta Organization' });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. 단일 워크스페이스 정책에 따라 동일 서버 내 워크스페이스 생성 요청은 단일 활성 워크스페이스로 귀속되어야 한다', () => {
    expect(workspaceA.id).toBeDefined();
    expect(workspaceB.id).toBe(workspaceA.id);
    expect(workspaceA.dbUrl).toBe(workspaceB.dbUrl);
  });

  it('2. 서버 내 모든 사용자는 단일 싱글톤 Workspace DB 인스턴스를 공유하며 프로젝트 데이터를 일관되게 조회해야 한다', async () => {
    const dbA = await workspaceManager.getDbClient(workspaceA);
    const dbB = await workspaceManager.getDbClient(workspaceB);

    expect(dbA).toBe(prisma);
    expect(dbB).toBe(prisma);

    const projectA = await dbA.project.create({
      data: {
        name: 'Unified Workspace Core Project',
        key: `UNIF_${Date.now()}`,
        ownerId: userA.id,
      },
    });

    const foundInUnifiedDb = await dbB.project.findUnique({ where: { id: projectA.id } });
    expect(foundInUnifiedDb).toBeDefined();
    expect(foundInUnifiedDb?.name).toBe('Unified Workspace Core Project');
  });

  it('3. 인증된 사용자가 워크스페이스 상세 조회 API 요청 시 단일 활성 워크스페이스로 정상 응답(200 OK)해야 한다', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceA.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(workspaceA.id);
  });
});
