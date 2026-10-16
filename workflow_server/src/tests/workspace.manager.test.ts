import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

describe('WorkspaceManager & Single-Workspace Unification Test', () => {
  let testUser1: any;
  let testUser2: any;
  let testWorkspace: any;

  beforeAll(async () => {
    // 1. Global DB에 테스트 유저 생성
    testUser1 = await globalPrisma.user.upsert({
      where: { email: 'ws_owner1@example.com' },
      update: {},
      create: {
        email: 'ws_owner1@example.com',
        name: 'Workspace Owner 1',
        role: 'MEMBER',
      },
    });

    testUser2 = await globalPrisma.user.upsert({
      where: { email: 'ws_owner2@example.com' },
      update: {},
      create: {
        email: 'ws_owner2@example.com',
        name: 'Workspace Member 2',
        role: 'MEMBER',
      },
    });

    // 2. 단일 활성 워크스페이스 조회 또는 생성
    testWorkspace = await globalPrisma.workspace.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' },
    });

    if (!testWorkspace) {
      testWorkspace = await globalPrisma.workspace.create({
        data: {
          slug: 'default-workspace',
          name: 'AntiGravity Single Workspace',
          ownerId: testUser1.id,
          dbType: 'postgresql',
          dbUrl: process.env.WORKSPACE_DATABASE_URL || 'postgresql://juyeong:qkrwndud@localhost:5432/workspace',
          status: 'ACTIVE',
        },
      });
    }

    // 3. Global DB에 멤버십(UserWorkspace) 매핑
    await globalPrisma.userWorkspace.upsert({
      where: {
        userId_workspaceId: {
          userId: testUser1.id,
          workspaceId: testWorkspace.id,
        },
      },
      update: { role: 'OWNER', status: 'ACTIVE' },
      create: {
        userId: testUser1.id,
        workspaceId: testWorkspace.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    await globalPrisma.userWorkspace.upsert({
      where: {
        userId_workspaceId: {
          userId: testUser2.id,
          workspaceId: testWorkspace.id,
        },
      },
      update: { role: 'MEMBER', status: 'ACTIVE' },
      create: {
        userId: testUser2.id,
        workspaceId: testWorkspace.id,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. Global DB에서 유저와 단일 워크스페이스 멤버십이 정확히 연계되어 조회되어야 한다', async () => {
    const userWithWorkspaces = await globalPrisma.user.findUnique({
      where: { id: testUser1.id },
      include: {
        workspaces: {
          where: { workspaceId: testWorkspace.id },
          include: { workspace: true },
        },
      },
    });

    expect(userWithWorkspaces).toBeDefined();
    expect(userWithWorkspaces?.workspaces.length).toBe(1);
    expect(userWithWorkspaces?.workspaces[0].workspace.id).toBe(testWorkspace.id);
    expect(userWithWorkspaces?.workspaces[0].role).toBe('OWNER');
  });

  it('2. WorkspaceManager를 통해 단일 워크스페이스 DB에 메타데이터 시딩 및 유저 동기화가 수행되어야 한다', async () => {
    const client = await workspaceManager.provisionWorkspaceDb(
      {
        id: testWorkspace.id,
        dbUrl: testWorkspace.dbUrl,
      },
      {
        id: testUser1.id,
        email: testUser1.email,
        name: testUser1.name,
      }
    );

    expect(client).toBe(prisma);

    const issueTypes = await client.issueType.findMany();
    expect(issueTypes.length).toBeGreaterThanOrEqual(4);

    const issueStatuses = await client.issueStatus.findMany();
    expect(issueStatuses.length).toBeGreaterThanOrEqual(4);

    const syncedUser = await client.user.findUnique({ where: { id: testUser1.id } });
    expect(syncedUser).toBeDefined();
    expect(syncedUser?.email).toBe('ws_owner1@example.com');
  });

  it('3. 단일 워크스페이스에 동기화된 구성원들이 동일한 워크스페이스 DB에서 프로젝트를 생성하고 공유할 수 있어야 한다', async () => {
    await workspaceManager.syncUserToWorkspace(prisma, {
      id: testUser2.id,
      email: testUser2.email,
      name: testUser2.name,
    });

    const client = await workspaceManager.getDbClient({
      id: testWorkspace.id,
      dbUrl: testWorkspace.dbUrl,
    });

    const uniqueKey = `SWS_${Date.now()}`;
    const createdProject = await client.project.create({
      data: {
        name: 'Single Workspace Shared Project',
        key: uniqueKey,
        ownerId: testUser1.id,
      },
    });

    expect(createdProject.id).toBeDefined();

    const foundProject = await client.project.findUnique({ where: { id: createdProject.id } });
    expect(foundProject).toBeDefined();
    expect(foundProject?.key).toBe(uniqueKey);
  });

  it('4. 연속적인 DB 클라이언트 요청 시 항상 싱글톤 PrismaClient 인스턴스를 반환해야 한다', async () => {
    const clientA = await workspaceManager.getDbClient({
      id: testWorkspace.id,
      dbUrl: testWorkspace.dbUrl,
    });

    const clientB = await workspaceManager.getDbClient();

    expect(clientA).toBe(prisma);
    expect(clientB).toBe(prisma);
    expect(clientA).toBe(clientB);
  });
});
