import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

describe('POST /api/workspaces - Single-Workspace Initialization & Ownership Binding', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: any;
  let userToken: string;

  beforeAll(async () => {
    testUser = await globalPrisma.user.upsert({
      where: { email: 'ws_creator@example.com' },
      update: {},
      create: {
        email: 'ws_creator@example.com',
        name: 'Workspace Creator',
        role: 'MEMBER',
      },
    });

    userToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. 비로그인 요청 시 401 Unauthorized 반환', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .send({ name: 'Unauthorized Team' });

    expect(res.status).toBe(401);
  });

  it('2. 워크스페이스 생성 요청 시 단일 활성 워크스페이스로 귀속되고 UserWorkspace(OWNER) 매핑이 보장되어야 한다', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Innovate AI Team',
        description: 'New generation AI issue management',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Innovate AI Team');
    expect(res.body.ownerId).toBe(testUser.id);
    expect(res.body.dbUrl).toBeDefined();
    expect(res.body.status).toBe('ACTIVE');

    // Global DB에 UserWorkspace(OWNER) 매핑이 생성되었는지 검증
    const membership = await globalPrisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: testUser.id,
          workspaceId: res.body.id,
        },
      },
    });
    expect(membership).toBeDefined();
    expect(membership?.role).toBe('OWNER');
    expect(membership?.status).toBe('ACTIVE');
  });
});
