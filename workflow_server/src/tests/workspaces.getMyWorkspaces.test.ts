import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';
import { createWorkspaceService } from '../modules/workspaces/services/createWorkspace.service.js';

describe('GET /api/workspaces - Single Workspace Architecture', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: any;
  let userToken: string;

  beforeAll(async () => {
    testUser = await globalPrisma.user.upsert({
      where: { email: 'ws_single_user@example.com' },
      update: {},
      create: {
        email: 'ws_single_user@example.com',
        name: 'Single Workspace User',
        role: 'MEMBER',
      },
    });

    userToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    await createWorkspaceService(testUser, { name: 'AntiGravity Core Space' });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. 단일 워크스페이스 정책에 따라 항상 단 1개의 활성 워크스페이스가 조회되어야 한다', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const ws = res.body[0];
    expect(ws).toBeDefined();
    expect(ws.myRole).toBeDefined();
    expect(ws.memberCount).toBeGreaterThanOrEqual(1);
  });

  it('2. GET /api/workspaces/current 로 ID 없이 단일 워크스페이스 상세가 정상 조회되어야 한다', async () => {
    const res = await request(app)
      .get('/api/workspaces/current')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBeDefined();
    expect(res.body.status).toBe('ACTIVE');
  });
});
