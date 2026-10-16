import { prisma } from '#lib/prisma.js';
import { PrismaClient as WorkspacePrismaClient, Prisma as WorkspacePrisma } from '../generated/workspace-client/index.js';

export type WorkspacePrismaTx = WorkspacePrisma.TransactionClient;
export type WorkspacePrismaClientOrTx = WorkspacePrismaClient | WorkspacePrismaTx;

export interface WorkspaceConnectionInfo {
  id: number;
  slug?: string;
  dbUrl?: string;
  dbType?: string;
}

export interface SyncUserData {
  id: number;
  email: string;
  name?: string | null;
  role?: string;
  avatar?: string | null;
  avatarColor?: string | null;
  preferences?: string | null;
}

/**
 * 🏢 단일 워크스페이스 데이터베이스 매니저 (1 Server = 1 Workspace)
 * - 멀티 워크스페이스 동적 커넥션 풀(clientPool)을 제거하고 싱글톤 `prisma` 인스턴스를 일원화하여 사용합니다.
 */
export class WorkspaceManager {
  private static instance: WorkspaceManager;

  private constructor() {}

  public static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager();
    }
    return WorkspaceManager.instance;
  }

  /**
   * 🔍 단일 워크스페이스 싱글톤 PrismaClient 반환
   */
  public async getDbClient(_workspace?: WorkspaceConnectionInfo): Promise<WorkspacePrismaClient> {
    return prisma;
  }

  /**
   * 📦 단일 워크스페이스 데이터베이스 기본 메타데이터 시딩 및 소유자 동기화
   */
  public async provisionWorkspaceDb(
    _workspace?: WorkspaceConnectionInfo,
    initialOwner?: SyncUserData
  ): Promise<WorkspacePrismaClient> {
    await this.seedDefaultMetadata(prisma);

    if (initialOwner) {
      await this.syncUserToWorkspace(prisma, initialOwner);
    }

    return prisma;
  }

  /**
   * 🌱 워크스페이스 기본 메타데이터 시딩
   */
  public async seedDefaultMetadata(client: WorkspacePrismaClient = prisma): Promise<void> {
    const issueTypes = [
      { id: 1, name: 'Task', description: '일반 작업', icon: 'CheckSquare', isSystem: true },
      { id: 2, name: 'Bug', description: '버그 수정', icon: 'Bug', isSystem: true },
      { id: 3, name: 'Epic', description: '상위 대형 일감 (에픽)', icon: 'Layers', isSystem: true },
      { id: 4, name: 'Story', description: '사용자 스토리', icon: 'Bookmark', isSystem: true },
    ];
    for (const type of issueTypes) {
      await client.issueType.upsert({
        where: { id: type.id },
        update: {},
        create: type,
      });
    }

    const issuePriorities = [
      { id: 1, name: 'LOW', level: 1, color: '#10b981', isSystem: true },
      { id: 2, name: 'MEDIUM', level: 2, color: '#f59e0b', isSystem: true },
      { id: 3, name: 'HIGH', level: 3, color: '#ef4444', isSystem: true },
      { id: 4, name: 'CRITICAL', level: 4, color: '#7c3aed', isSystem: true },
    ];
    for (const priority of issuePriorities) {
      await client.issuePriority.upsert({
        where: { id: priority.id },
        update: {},
        create: priority,
      });
    }

    const issueStatuses = [
      { id: 1, name: 'TODO', category: 'TODO', isSystem: true },
      { id: 2, name: 'IN_PROGRESS', category: 'IN_PROGRESS', isSystem: true },
      { id: 3, name: 'IN_REVIEW', category: 'IN_PROGRESS', isSystem: true },
      { id: 4, name: 'DONE', category: 'DONE', isSystem: true },
      { id: 5, name: 'HOLD', category: 'TODO', isSystem: true },
    ];
    for (const status of issueStatuses) {
      await client.issueStatus.upsert({
        where: { id: status.id },
        update: {},
        create: status,
      });
    }

    const projectPriorities = [
      { id: 1, name: 'LOW', level: 1, color: '#10b981', isSystem: true },
      { id: 2, name: 'MEDIUM', level: 2, color: '#f59e0b', isSystem: true },
      { id: 3, name: 'HIGH', level: 3, color: '#ef4444', isSystem: true },
    ];
    for (const p of projectPriorities) {
      await client.projectPriority.upsert({
        where: { id: p.id },
        update: {},
        create: p,
      });
    }

    const projectStatuses = [
      { id: 1, name: 'PLANNING', category: 'TODO', isSystem: true },
      { id: 2, name: 'ACTIVE', category: 'IN_PROGRESS', isSystem: true },
      { id: 3, name: 'COMPLETED', category: 'DONE', isSystem: true },
      { id: 4, name: 'ON_HOLD', category: 'TODO', isSystem: true },
    ];
    for (const s of projectStatuses) {
      await client.projectStatus.upsert({
        where: { id: s.id },
        update: {},
        create: s,
      });
    }

    const milestonePriorities = [
      { id: 1, name: 'LOW', level: 1, color: '#10b981', isSystem: true },
      { id: 2, name: 'MEDIUM', level: 2, color: '#f59e0b', isSystem: true },
      { id: 3, name: 'HIGH', level: 3, color: '#ef4444', isSystem: true },
    ];
    for (const mp of milestonePriorities) {
      await client.milestonePriority.upsert({
        where: { id: mp.id },
        update: {},
        create: mp,
      });
    }

    const milestoneStatuses = [
      { id: 1, name: 'OPEN', category: 'TODO', isSystem: true },
      { id: 2, name: 'CLOSED', category: 'DONE', isSystem: true },
    ];
    for (const ms of milestoneStatuses) {
      await client.milestoneStatus.upsert({
        where: { id: ms.id },
        update: {},
        create: ms,
      });
    }

    const testRunStatuses = [
      { id: 1, name: 'PENDING', category: 'TODO', isSystem: true },
      { id: 2, name: 'IN_PROGRESS', category: 'IN_PROGRESS', isSystem: true },
      { id: 3, name: 'COMPLETED', category: 'DONE', isSystem: true },
    ];
    for (const trs of testRunStatuses) {
      await client.testRunStatus.upsert({
        where: { id: trs.id },
        update: {},
        create: trs,
      });
    }

    const testResultStatuses = [
      { id: 1, name: 'PASS', category: 'PASS', isSystem: true },
      { id: 2, name: 'FAIL', category: 'FAIL', isSystem: true },
      { id: 3, name: 'BLOCKED', category: 'BLOCKED', isSystem: true },
      { id: 4, name: 'SKIPPED', category: 'SKIPPED', isSystem: true },
    ];
    for (const tr of testResultStatuses) {
      await client.testResultStatus.upsert({
        where: { id: tr.id },
        update: {},
        create: tr,
      });
    }

    const testStepTypes = [
      { id: 1, name: 'SETUP', isSystem: true },
      { id: 2, name: 'PROCEDURE', isSystem: true },
      { id: 3, name: 'TEARDOWN', isSystem: true },
    ];
    for (const tst of testStepTypes) {
      await client.testStepType.upsert({
        where: { id: tst.id },
        update: {},
        create: tst,
      });
    }
  }

  /**
   * 🔄 Global 유저 정보를 단일 워크스페이스 DB에 동기화 (Upsert)
   */
  public async syncUserToWorkspace(
    clientOrWorkspace: WorkspacePrismaClientOrTx | WorkspaceConnectionInfo | undefined,
    user: SyncUserData
  ): Promise<void> {
    const client: WorkspacePrismaClientOrTx =
      clientOrWorkspace && typeof (clientOrWorkspace as any).user?.upsert === 'function'
        ? (clientOrWorkspace as WorkspacePrismaClientOrTx)
        : prisma;

    await client.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        role: user.role ?? 'MEMBER',
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        preferences: user.preferences ?? '{}',
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role ?? 'MEMBER',
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        preferences: user.preferences ?? '{}',
      },
    });
  }

  public async closeClient(_workspaceId?: number): Promise<void> {
    // 단일 워크스페이스 싱글톤 구조이므로 별도 풀 해제 불필요
  }

  public async closeAll(): Promise<void> {
    // 단일 워크스페이스 싱글톤 구조이므로 별도 풀 해제 불필요
  }
}

export const workspaceManager = WorkspaceManager.getInstance();
