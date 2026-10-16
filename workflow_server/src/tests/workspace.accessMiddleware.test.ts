import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';
import { requireAuth } from '../common/middlewares/authMiddleware.js';
import { requireWorkspaceAccess, requireWorkspaceRole } from '../common/middlewares/workspaceMiddleware.js';

describe('Workspace Access Security Middleware (requireWorkspaceAccess - Single Workspace)', () => {
  const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';

  let ownerUser: any;
  let memberUser: any;
  let newJoinerUser: any;
  let superAdminUser: any;

  let ownerToken: string;
  let memberToken: string;
  let newJoinerToken: string;
  let superAdminToken: string;

  let activeWorkspace: any;

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

    newJoinerUser = await globalPrisma.user.upsert({
      where: { email: 'sec_outsider@example.com' },
      update: {},
      create: { email: 'sec_outsider@example.com', name: 'WS New Joiner', role: 'MEMBER' },
    });

    superAdminUser = await globalPrisma.user.upsert({
      where: { email: 'sec_superadmin@example.com' },
      update: { role: 'ADMIN' },
      create: { email: 'sec_superadmin@example.com', name: 'Super Admin', role: 'ADMIN' },
    });

    // 2. JWT 토큰 발급
    ownerToken = jwt.sign({ userId: ownerUser.id, email: ownerUser.email }, jwtSecret, { expiresIn: '1h' });
    memberToken = jwt.sign({ userId: memberUser.id, email: memberUser.email }, jwtSecret, { expiresIn: '1h' });
    newJoinerToken = jwt.sign({ userId: newJoinerUser.id, email: newJoinerUser.email }, jwtSecret, { expiresIn: '1h' });
    superAdminToken = jwt.sign({ userId: superAdminUser.id, email: superAdminUser.email }, jwtSecret, { expiresIn: '1h' });

    // 3. 서버의 단일 활성 워크스페이스 조회
    activeWorkspace = await globalPrisma.workspace.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' },
    });

    if (!activeWorkspace) {
      activeWorkspace = await globalPrisma.workspace.create({
        data: {
          slug: 'default-workspace',
          name: 'AntiGravity Single Workspace',
          ownerId: ownerUser.id,
          dbType: 'postgresql',
          dbUrl: process.env.WORKSPACE_DATABASE_URL || 'postgresql://juyeong:qkrwndud@localhost:5432/workspace_test',
          status: 'ACTIVE',
        },
      });
    }

    // 4. 단일 활성 워크스페이스에 대한 UserWorkspace 매핑 설정
    await globalPrisma.userWorkspace.upsert({
      where: { userId_workspaceId: { userId: ownerUser.id, workspaceId: activeWorkspace.id } },
      update: { role: 'OWNER', status: 'ACTIVE' },
      create: { userId: ownerUser.id, workspaceId: activeWorkspace.id, role: 'OWNER', status: 'ACTIVE' },
    });

    await globalPrisma.userWorkspace.upsert({
      where: { userId_workspaceId: { userId: memberUser.id, workspaceId: activeWorkspace.id } },
      update: { role: 'MEMBER', status: 'ACTIVE' },
      create: { userId: memberUser.id, workspaceId: activeWorkspace.id, role: 'MEMBER', status: 'ACTIVE' },
    });

    // newJoinerUser는 초기 멤버십 없이 시작하여 자동 MEMBER 편입을 테스트
    await globalPrisma.userWorkspace.deleteMany({
      where: { userId: newJoinerUser.id, workspaceId: activeWorkspace.id },
    });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. 인증 토큰 없이 워크스페이스에 접근하면 401 Unauthorized 에러가 반환되어야 한다', async () => {
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('x-workspace-id', String(activeWorkspace.id));

    expect(res.status).toBe(401);
  });

  it('2. 단일 워크스페이스 정책에 따라 신규 인증 사용자가 접근 시 자동으로 MEMBER 권한으로 편입되고 200 OK를 반환해야 한다', async () => {
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('Authorization', `Bearer ${newJoinerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.workspaceId).toBe(activeWorkspace.id);
    expect(res.body.workspaceRole).toBe('MEMBER');
    expect(res.body.hasDbClient).toBe(true);
  });

  it('3. 워크스페이스 소유자(Owner)가 접근 시 200 OK와 함께 OWNER 권한 및 DB 인스턴스가 주입되어야 한다', async () => {
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.workspaceRole).toBe('OWNER');
    expect(res.body.hasDbClient).toBe(true);
  });

  it('4. 등록된 일반 멤버(Member)가 접근 시 200 OK와 함께 MEMBER 권한 및 DB 인스턴스가 주입되어야 한다', async () => {
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.workspaceRole).toBe('MEMBER');
    expect(res.body.hasDbClient).toBe(true);
  });

  it('5. 시스템 최고 관리자(Super Admin)는 워크스페이스 멤버가 아니어도 OWNER 권한으로 접근할 수 있어야 한다', async () => {
    const res = await request(testApp)
      .get('/api/test-workspace/data')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.workspaceRole).toBe('OWNER');
    expect(res.body.hasDbClient).toBe(true);
  });

  it('6. requireWorkspaceRole 미들웨어: 일반 MEMBER가 ADMIN 전용 API 호출 시 403 Forbidden으로 차단되어야 한다', async () => {
    const res = await request(testApp)
      .post('/api/test-workspace/admin-action')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Minimum 'ADMIN' role required");
  });

  it('7. requireWorkspaceRole 미들웨어: OWNER는 ADMIN 전용 API를 성공적으로 수행할 수 있어야 한다', async () => {
    const res = await request(testApp)
      .post('/api/test-workspace/admin-action')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
