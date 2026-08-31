// -*- coding: utf-8 -*-
import fs from 'fs';
import path from 'path';
import { PrismaClient as WorkspacePrismaClient, Prisma as WorkspacePrisma } from '../generated/workspace-client/index.js';

export type WorkspacePrismaTx = WorkspacePrisma.TransactionClient;
export type WorkspacePrismaClientOrTx = WorkspacePrismaClient | WorkspacePrismaTx;

export interface WorkspaceConnectionInfo {
  id: number;
  slug?: string;
  dbUrl: string;
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
 * 🏢 동적 워크스페이스 데이터베이스 커넥션 매니저
 */
export class WorkspaceManager {
  private static instance: WorkspaceManager;
  private clientPool: Map<number, WorkspacePrismaClient> = new Map();

  private constructor() {}

  public static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager();
    }
    return WorkspaceManager.instance;
  }

  /**
   * 🔍 워크스페이스 ID에 해당하는 PrismaClient 인스턴스를 가져오거나 동적으로 생성
   */
  public async getDbClient(workspace: WorkspaceConnectionInfo): Promise<WorkspacePrismaClient> {
    if (this.clientPool.has(workspace.id)) {
      return this.clientPool.get(workspace.id)!;
    }

    // SQLite 파일 기반인 경우 디렉터리 존재 보장
    if (workspace.dbUrl.startsWith('file:')) {
      const filePath = workspace.dbUrl.replace(/^file:/, '');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // DB 파일이 없는 경우 기본 템플릿 복사 또는 초기 프로비저닝
      if (!fs.existsSync(filePath)) {
        await this.provisionWorkspaceDb(workspace);
      }
    }

    const client = new WorkspacePrismaClient({
      datasources: {
        db: {
          url: workspace.dbUrl,
        },
      },
    });

    await client.$connect();
    this.clientPool.set(workspace.id, client);
    return client;
  }

  /**
   * 📦 워크스페이스 데이터베이스 신규 프로비저닝 및 기본 메타데이터 시딩
   */
  public async provisionWorkspaceDb(
    workspace: WorkspaceConnectionInfo,
    initialOwner?: SyncUserData
  ): Promise<WorkspacePrismaClient> {
    const defaultTemplatePath = path.resolve(process.cwd(), '.tmp/workspaces/default.db');
    let targetFilePath: string | null = null;

    if (workspace.dbUrl.startsWith('file:')) {
      targetFilePath = workspace.dbUrl.replace(/^file:/, '');
      const dir = path.dirname(targetFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 기본 템플릿 DB가 존재하면 복사하여 빠르게 초기화
      if (fs.existsSync(defaultTemplatePath) && !fs.existsSync(targetFilePath)) {
        fs.copyFileSync(defaultTemplatePath, targetFilePath);
      }
    }

    const client = new WorkspacePrismaClient({
      datasources: {
        db: {
          url: workspace.dbUrl,
        },
      },
    });

    await client.$connect();

    // 기본 메타데이터 시딩 (없을 경우에만 생성)
    await this.seedDefaultMetadata(client);

    // 초기 소유자가 주어진 경우 유저 정보 동기화
    if (initialOwner) {
      await this.syncUserToWorkspace(client, initialOwner);
    }

    this.clientPool.set(workspace.id, client);
    return client;
  }

  /**
   * 🌱 워크스페이스 기본 메타데이터 시딩
   */
  public async seedDefaultMetadata(client: WorkspacePrismaClient): Promise<void> {
    // 1. Issue Types
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

    // 2. Issue Priorities
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

    // 3. Issue Statuses
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

    // 4. Project Priorities & Statuses
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

    // 5. Milestone Priorities & Statuses
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

    // 6. Test Statuses & Step Types
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
   * 🔄 Global 유저 정보를 특정 워크스페이스 DB에 동기화 (Upsert)
   */
  public async syncUserToWorkspace(
    clientOrWorkspace: WorkspacePrismaClient | WorkspaceConnectionInfo,
    user: SyncUserData
  ): Promise<void> {
    const client =
      typeof (clientOrWorkspace as any).$connect === 'function'
        ? (clientOrWorkspace as WorkspacePrismaClient)
        : await this.getDbClient(clientOrWorkspace as WorkspaceConnectionInfo);

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

  /**
   * 🛑 특정 워크스페이스 연결 해제 및 캐시 제거
   */
  public async closeClient(workspaceId: number): Promise<void> {
    const client = this.clientPool.get(workspaceId);
    if (client) {
      await client.$disconnect();
      this.clientPool.delete(workspaceId);
    }
  }

  /**
   * 🛑 모든 워크스페이스 데이터베이스 연결 종료
   */
  public async closeAll(): Promise<void> {
    for (const [id, client] of this.clientPool.entries()) {
      try {
        await client.$disconnect();
      } catch (err) {
        console.error(`Failed to disconnect workspace client [${id}]:`, err);
      }
    }
    this.clientPool.clear();
  }
}

export const workspaceManager = WorkspaceManager.getInstance();
