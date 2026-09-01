import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';
import { createWorkspaceService } from '../modules/workspaces/services/createWorkspace.service.js';

describe('POST /api/workspaces/:id/invite - Invite Member & Sync User', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let ownerUser: any;
  let inviteeUser: any;
  let ownerToken: string;
  let workspace: any;

  beforeAll(async () => {
    ownerUser = await globalPrisma.user.upsert({
      where: { email: 'ws_inviter@example.com' },
      update: {},
      create: {
        email: 'ws_inviter@example.com',
        name: 'Inviter Owner',
        role: 'MEMBER',
      },
    });

    inviteeUser = await globalPrisma.user.upsert({
      where: { email: 'ws_invitee@example.com' },
      update: {},
      create: {
        email: 'ws_invitee@example.com',
        name: 'Invitee Member',
        role: 'MEMBER',
      },
    });

    ownerToken = jwt.sign(
      { userId: ownerUser.id, email: ownerUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    workspace = await createWorkspaceService(ownerUser, { name: 'Collaboration Team' });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. 소유자가 새 멤버를 초대하면 Global UserWorkspace에 등록되고 테넌트 DB에 유저가 동기화되어야 한다', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/invite`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', String(workspace.id))
      .send({
        email: inviteeUser.email,
        role: 'MEMBER',
      });

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(inviteeUser.id);
    expect(res.body.role).toBe('MEMBER');

    // 테넌트 DB에 유저가 실제로 동기화되었는지 검증
    const tenantDb = await workspaceManager.getDbClient(workspace);
    const syncedUser = await tenantDb.user.findUnique({ where: { id: inviteeUser.id } });
    expect(syncedUser).toBeDefined();
    expect(syncedUser?.email).toBe(inviteeUser.email);
  });
});
