import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';
import { requireAuth } from '../common/middlewares/authMiddleware.js';
import { requireWorkspaceAccess, requireWorkspaceRole } from '../common/middlewares/workspaceMiddleware.js';

describe('Workspace Access Security Middleware (requireWorkspaceAccess)', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
  const testDbDir = path.resolve(process.cwd(), '.tmp/workspaces/test_sec');
  const ws1DbPath = path.join(testDbDir, 'sec_ws_1.db').replace(/\\/g, '/');
  const ws2DbPath = path.join(testDbDir, 'sec_ws_2.db').replace(/\\/g, '/');

  let ownerUser: any;
  let memberUser: any;
  let outsiderUser: any;
  let superAdminUser: any;

  let ownerToken: string;
  let memberToken: string;
  let outsiderToken: string;
  let superAdminToken: string;

  let workspace1: any;
  let workspace2: any;

  // 테스트용 Express App 생성
  const testApp = express();
  testApp.use(express.json());

  // 워크스페이스 일반 접근 엔드포인트
  testApp.get('/api/test-workspace/data', requireAuth, requireWorkspaceAccess, (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      workspaceId: req.workspace?.id,
      workspaceSlug: req.workspace?.slug,
      workspaceRole: req.workspaceRole,
      hasDbClient: !!req.workspaceDb,
    });
  });

  // 워크스페이스 관리자 전용 엔드포인트 (requireWorkspaceRole('ADMIN'))
  testApp.post(
    '/api/test-workspace/admin-action',
    requireAuth,
    requireWorkspaceAccess,
    requireWorkspaceRole('ADMIN'),
    (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Admin action executed successfully',
        workspaceRole: req.workspaceRole,
      });
    }
  );

  beforeAll(async () => {
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDbDir, { recursive: true });

    // 1. Global DB 사용자 생성
    ownerUser = await globalPrisma.user.upsert({
      where: { email: 'sec_owner@example.com' },
      update: {},
      create: { email: 'sec_owner@example.com', name: 'WS Owner', role: 'MEMBER' },
    });

    memberUser = await globalPrisma.user.upsert({
      where: { email: 'sec_member@example.com' },
      update: {},
      create: { email: 'sec_member@example.com', name: 'WS Member', role: 'MEMBER' },
    });

    outsiderUser = await globalPrisma.user.upsert({
      where: { email: 'sec_outsider@example.com' },
      update: {},
      create: { email: 'sec_outsider@example.com', name: 'WS Outsider', role: 'MEMBER' },
    });

    superAdminUser = await globalPrisma.user.upsert({
      where: { email: 'sec_superadmin@example.com' },
      update: {},
      create: { email: 'sec_superadmin@example.com', name: 'Super Admin', role: 'ADMIN' },
    });

    // 2. JWT 토큰 발급
    ownerToken = jwt.sign({ userId: ownerUser.id, email: ownerUser.email }, jwtSecret, { expiresIn: '1h' });
    memberToken = jwt.sign({ userId: memberUser.id, email: memberUser.email }, jwtSecret, { expiresIn: '1h' });
    outsiderToken = jwt.sign({ userId: outsiderUser.id, email: outsiderUser.email }, jwtSecret, { expiresIn: '1h' });
    superAdminToken = jwt.sign({ userId: superAdminUser.id, email: superAdminUser.email }, jwtSecret, { expiresIn: '1h' });

    // 3. Workspace 생성
    workspace1 = await globalPrisma.workspace.upsert({
      where: { slug: 'sec-ws-1' },
      update: { dbUrl: `file:${ws1DbPath}` },
      create: {
        slug: 'sec-ws-1',
        name: 'Security Test Workspace 1',
        ownerId: ownerUser.id,
        dbType: 'sqlite',
        dbUrl: `file:${ws1DbPath}`,
        status: 'ACTIVE',
      },
    });

    workspace2 = await globalPrisma.workspace.upsert({
      where: { slug: 'sec-ws-2' },
      update: { dbUrl: `file:${ws2DbPath}` },
      create: {
        slug: 'sec-ws-2',
        name: 'Security Test Workspace 2',
        ownerId: ownerUser.id,
        dbType: 'sqlite',
        dbUrl: `file:${ws2DbPath}`,
        status: 'ACTIVE',
      },
    });

    // 4. UserWorkspace 매핑 (memberUser는 Workspace 1에만 MEMBER로 등록)
    await globalPrisma.userWorkspace.upsert({
      where: { userId_workspaceId: { userId: ownerUser.id, workspaceId: workspace1.id } },
      update: {},
      create: { userId: ownerUser.id, workspaceId: workspace1.id, role: 'OWNER', status: 'ACTIVE' },
    });

    await globalPrisma.userWorkspace.upsert({
      where: { userId_workspaceId: { userId: memberUser.id, workspaceId: workspace1.id } },
      update: {},
      create: { userId: memberUser.id, workspaceId: workspace1.id, role: 'MEMBER', status: 'ACTIVE' },
    });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. 인증 토큰 없이 워크스페이스에 접근하면 401 Unauthorized 에러가 반환되어야 한다', async () => {
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('x-workspace-id', String(workspace1.id));

    expect(res.status).toBe(401);
  });

  it('2. 참여하지 않은 사용자가 워크스페이스 DB에 접근 요청 시 403 Forbidden으로 차단되어야 한다 (보안 격리)', async () => {
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .set('x-workspace-id', String(workspace1.id));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('WORKSPACE_ACCESS_DENIED');
  });

  it('3. 워크스페이스 소유자(Owner)가 접근 시 200 OK와 함께 OWNER 권한 및 DB 인스턴스가 주입되어야 한다', async () => {
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', String(workspace1.id));

    expect(res.status).toBe(200);
    expect(res.body.workspaceRole).toBe('OWNER');
    expect(res.body.hasDbClient).toBe(true);
  });

  it('4. 등록된 일반 멤버(Member)가 접근 시 200 OK와 함께 MEMBER 권한 및 DB 인스턴스가 주입되어야 한다', async () => {
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-slug', 'sec-ws-1');

    expect(res.status).toBe(200);
    expect(res.body.workspaceRole).toBe('MEMBER');
    expect(res.body.hasDbClient).toBe(true);
  });

  it('5. 시스템 최고 관리자(Super Admin)는 워크스페이스 멤버가 아니어도 OWNER 권한으로 접근할 수 있어야 한다', async () => {
    // superAdminUser는 workspace2에 멤버로 등록되어 있지 않음
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('x-workspace-id', String(workspace2.id));

    expect(res.status).toBe(200);
    expect(res.body.workspaceRole).toBe('OWNER');
    expect(res.body.hasDbClient).toBe(true);
  });

  it('6. requireWorkspaceRole 미들웨어: 일반 MEMBER가 ADMIN 전용 API 호출 시 403 Forbidden으로 차단되어야 한다', async () => {
    const res = await request(testApp)
      .post('/api/test-workspace/admin-action')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', String(workspace1.id));

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Minimum \'ADMIN\' role required');
  });

  it('7. requireWorkspaceRole 미들웨어: OWNER는 ADMIN 전용 API를 성공적으로 수행할 수 있어야 한다', async () => {
    const res = await request(testApp)
      .post('/api/test-workspace/admin-action')
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-workspace-id', String(workspace1.id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
