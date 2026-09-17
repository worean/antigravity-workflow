import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

describe('WorkspaceManager & Multi-Database Isolation Test', () => {
  const testDbDir = path.resolve(process.cwd(), '.tmp/workspaces/test');
  const ws1DbPath = path.join(testDbDir, 'test_ws_1.db').replace(/\\/g, '/');
  const ws2DbPath = path.join(testDbDir, 'test_ws_2.db').replace(/\\/g, '/');

  let testUser1: any;
  let testUser2: any;
  let testWorkspace1: any;
  let testWorkspace2: any;

  beforeAll(async () => {
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDbDir, { recursive: true });

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
        name: 'Workspace Owner 2',
        role: 'MEMBER',
      },
    });

    // 2. Global DB에 워크스페이스 레코드 생성
    testWorkspace1 = await globalPrisma.workspace.upsert({
      where: { slug: 'test-alpha-ws' },
      update: { dbUrl: `file:${ws1DbPath}` },
      create: {
        slug: 'test-alpha-ws',
        name: 'Alpha Team Workspace',
        ownerId: testUser1.id,
        dbType: 'sqlite',
        dbUrl: `file:${ws1DbPath}`,
      },
    });

    testWorkspace2 = await globalPrisma.workspace.upsert({
      where: { slug: 'test-beta-ws' },
      update: { dbUrl: `file:${ws2DbPath}` },
      create: {
        slug: 'test-beta-ws',
        name: 'Beta Team Workspace',
        ownerId: testUser2.id,
        dbType: 'sqlite',
        dbUrl: `file:${ws2DbPath}`,
      },
    });

    // 3. Global DB에 멤버십(UserWorkspace) 매핑
    await globalPrisma.userWorkspace.upsert({
      where: {
        userId_workspaceId: {
          userId: testUser1.id,
          workspaceId: testWorkspace1.id,
        },
      },
      update: {},
      create: {
        userId: testUser1.id,
        workspaceId: testWorkspace1.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    await globalPrisma.userWorkspace.upsert({
      where: {
        userId_workspaceId: {
          userId: testUser2.id,
          workspaceId: testWorkspace2.id,
        },
      },
      update: {},
      create: {
        userId: testUser2.id,
        workspaceId: testWorkspace2.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    await workspaceManager.closeAll();
  });

  it('1. Global DB에서 유저와 워크스페이스 멤버십이 정확히 연계되어 조회되어야 한다', async () => {
    const userWithWorkspaces = await globalPrisma.user.findUnique({
      where: { id: testUser1.id },
      include: {
        workspaces: {
          include: { workspace: true },
        },
      },
    });

    expect(userWithWorkspaces).toBeDefined();
    expect(userWithWorkspaces?.workspaces.length).toBeGreaterThan(0);
    expect(userWithWorkspaces?.workspaces[0].workspace.slug).toBe('test-alpha-ws');
    expect(userWithWorkspaces?.workspaces[0].role).toBe('OWNER');
  });

  it('2. WorkspaceManager를 통해 워크스페이스 전용 DB 클라이언트를 생성하고 메타데이터가 시딩되어야 한다', async () => {
    const client1 = await workspaceManager.provisionWorkspaceDb(
      {
        id: testWorkspace1.id,
        dbUrl: testWorkspace1.dbUrl,
      },
      {
        id: testUser1.id,
        email: testUser1.email,
        name: testUser1.name,
      }
    );

    expect(client1).toBeDefined();

    // 메타데이터(IssueType, IssueStatus 등) 검증
    const issueTypes = await client1.issueType.findMany();
    expect(issueTypes.length).toBeGreaterThanOrEqual(4);

    const issueStatuses = await client1.issueStatus.findMany();
    expect(issueStatuses.length).toBeGreaterThanOrEqual(4);

    // 테넌트 DB에 유저가 정상 동기화되었는지 검증
    const tenantUser = await client1.user.findUnique({ where: { id: testUser1.id } });
    expect(tenantUser).toBeDefined();
    expect(tenantUser?.email).toBe('ws_owner1@example.com');
  });

  it('3. 물리적으로 분리된 두 워크스페이스 DB 간에 데이터 격리(Isolation)가 완벽히 보장되어야 한다', async () => {
    const client1 = await workspaceManager.getDbClient({
      id: testWorkspace1.id,
      dbUrl: testWorkspace1.dbUrl,
    });

    const client2 = await workspaceManager.provisionWorkspaceDb(
      {
        id: testWorkspace2.id,
        dbUrl: testWorkspace2.dbUrl,
      },
      {
        id: testUser2.id,
        email: testUser2.email,
        name: testUser2.name,
      }
    );

    // Workspace 1에만 프로젝트 생성
    const uniqueKey = `ALPHA_${Date.now()}`;
    const project1 = await client1.project.create({
      data: {
        name: 'Alpha Project Exclusive',
        key: uniqueKey,
        ownerId: testUser1.id,
      },
    });

    expect(project1.id).toBeDefined();

    // Workspace 1에서 프로젝트 조회 확인
    const foundInWs1 = await client1.project.findUnique({ where: { id: project1.id } });
    expect(foundInWs1).toBeDefined();
    expect(foundInWs1?.key).toBe(uniqueKey);

    // ⭐️ Workspace 2에서는 해당 프로젝트가 존재하지 않아야 함 (완벽한 데이터 격리)
    const foundInWs2 = await client2.project.findUnique({ where: { id: project1.id } });
    expect(foundInWs2).toBeNull();
  });

  it('4. 동일한 워크스페이스에 대한 연속 요청 시 Connection Cache 풀에서 인스턴스를 재사용해야 한다', async () => {
    const clientA = await workspaceManager.getDbClient({
      id: testWorkspace1.id,
      dbUrl: testWorkspace1.dbUrl,
    });

    const clientB = await workspaceManager.getDbClient({
      id: testWorkspace1.id,
      dbUrl: testWorkspace1.dbUrl,
    });

    expect(clientA).toBe(clientB); // 메모리상 동일 인스턴스 참조 확인
  });
});
