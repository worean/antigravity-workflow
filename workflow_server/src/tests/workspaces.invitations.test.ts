import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';
import { createWorkspaceService } from '../modules/workspaces/services/createWorkspace.service.js';

describe('Workspace Invitations & Join by Token API', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  let ownerUser: any;
  let existingUser: any;
  let newJoinedUser: any;

  let ownerToken: string;
  let newJoinedToken: string;
  let workspace: any;

  beforeAll(async () => {
    ownerUser = await globalPrisma.user.upsert({
      where: { email: 'inv_owner@example.com' },
      update: {},
      create: { email: 'inv_owner@example.com', name: 'Invite Owner', role: 'MEMBER' },
    });

    existingUser = await globalPrisma.user.upsert({
      where: { email: 'inv_existing@example.com' },
      update: {},
      create: { email: 'inv_existing@example.com', name: 'Existing User', role: 'MEMBER' },
    });

    newJoinedUser = await globalPrisma.user.upsert({
      where: { email: 'inv_newjoined@example.com' },
      update: {},
      create: { email: 'inv_newjoined@example.com', name: 'New Joined User', role: 'MEMBER' },
    });

    ownerToken = jwt.sign({ userId: ownerUser.id, email: ownerUser.email }, jwtSecret, { expiresIn: '1h' });
    newJoinedToken = jwt.sign({ userId: newJoinedUser.id, email: newJoinedUser.email }, jwtSecret, { expiresIn: '1h' });

    workspace = await createWorkspaceService(ownerUser, { name: 'Invitation Test Workspace' });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. 이미 가입된 사용자의 이메일로 초대 시 즉시 워크스페이스 멤버로 등록되어야 한다 (directJoined: true)', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', String(workspace.id))
      .send({
        email: existingUser.email,
        role: 'ADMIN',
      });

    expect(res.status).toBe(200);
    expect(res.body.directJoined).toBe(true);
    expect(res.body.membership.userId).toBe(existingUser.id);
    expect(res.body.membership.role).toBe('ADMIN');
  });

  it('2. 신규 이메일로 초대 요청 시 inviteToken이 발급되고 초대장이 생성되어야 한다', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspace.id}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', String(workspace.id))
      .send({
        email: 'future_member@example.com',
        role: 'MEMBER',
      });

    expect(res.status).toBe(200);
    expect(res.body.directJoined).toBe(false);
    expect(res.body.inviteToken).toBeDefined();
    expect(res.body.inviteUrl).toContain(res.body.inviteToken);
  });

  it('3. 발급된 초대 토큰으로 신규 유저가 가입(join)할 수 있어야 한다', async () => {
    // 1) 아직 가입되지 않은 이메일로 초대장 발급
    const createRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', String(workspace.id))
      .send({
        email: 'unregistered_guest@example.com',
        role: 'MEMBER',
      });

    expect(createRes.status).toBe(200);
    expect(createRes.body.directJoined).toBe(false);
    const token = createRes.body.inviteToken;
    expect(token).toBeDefined();

    // 2) 신규 유저가 토큰으로 참가 요청
    const joinRes = await request(app)
      .post('/api/workspaces/join')
      .set('Authorization', `Bearer ${newJoinedToken}`)
      .send({ inviteToken: token });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.success).toBe(true);
    expect(joinRes.body.workspace.id).toBe(workspace.id);

    // 3) Global DB 확인
    const membership = await globalPrisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: newJoinedUser.id,
          workspaceId: workspace.id,
        },
      },
    });
    expect(membership).toBeDefined();
    expect(membership?.status).toBe('ACTIVE');
  });

  it('4. 대기 중인 초대 목록 조회 및 취소/삭제가 정상 작동해야 한다', async () => {
    // 1) 초대장 생성
    const createRes = await request(app)
      .post(`/api/workspaces/${workspace.id}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', String(workspace.id))
      .send({
        email: 'to_be_cancelled@example.com',
        role: 'GUEST',
      });

    const invitationId = createRes.body.invitation.id;

    // 2) 목록 조회
    const listRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', String(workspace.id));

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.some((i: any) => i.id === invitationId)).toBe(true);

    // 3) 초대 취소
    const delRes = await request(app)
      .delete(`/api/workspaces/${workspace.id}/invitations/${invitationId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', String(workspace.id));

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });
});
