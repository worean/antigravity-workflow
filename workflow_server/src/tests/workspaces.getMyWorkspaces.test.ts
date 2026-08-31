// -*- coding: utf-8 -*-
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';
import { createWorkspaceService } from '../modules/workspaces/services/createWorkspace.service.js';

describe('GET /api/workspaces - Get My Workspaces', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let testUser: any;
  let userToken: string;

  beforeAll(async () => {
    testUser = await globalPrisma.user.upsert({
      where: { email: 'ws_multi_user@example.com' },
      update: {},
      create: {
        email: 'ws_multi_user@example.com',
        name: 'Multi Workspace User',
        role: 'MEMBER',
      },
    });

    userToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 2개의 워크스페이스 생성
    await createWorkspaceService(testUser, { name: 'My Project Space 1' });
    await createWorkspaceService(testUser, { name: 'My Project Space 2' });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. 사용자가 참여 중인 워크스페이스 목록과 역할이 정상 조회되어야 한다', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const space1 = res.body.find((w: any) => w.name === 'My Project Space 1');
    expect(space1).toBeDefined();
    expect(space1.myRole).toBe('OWNER');
    expect(space1.memberCount).toBeGreaterThanOrEqual(1);
  });
});
