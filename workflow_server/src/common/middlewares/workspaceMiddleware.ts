import { Request, Response, NextFunction } from 'express';
import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma as defaultWorkspacePrisma } from '#lib/prisma.js';

/**
 * 🔒 단일 워크스페이스 데이터베이스 접근 인가 미들웨어
 *
 * 구조:
 * - 시스템 전반에 단일 기본 워크스페이스만 운영합니다.
 * - 클라이언트가 x-workspace-id 헤더나 workspaceId 파라미터를 넘길 필요 없이,
 *   항상 활성화된 단일 워크스페이스와 Workspace DB PrismaClient를 자동 주입합니다.
 */
export const requireWorkspaceAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    // 1. 단일 기본 워크스페이스 조회 (클라이언트가 넘기지 않아도 항상 자동 로드)
    let workspace: any = null;
    let workspaceId = Number(
      req.headers['x-workspace-id'] ||
        req.params.workspaceId ||
        req.query.workspaceId ||
        req.body?.workspaceId
    );

    if (workspaceId && !isNaN(workspaceId)) {
      workspace = await globalPrisma.workspace.findUnique({ where: { id: workspaceId } });
    }

    if (!workspace) {
      workspace = await globalPrisma.workspace.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { id: 'asc' },
      });
    }

    if (!workspace) {
      // 기본 워크스페이스가 없을 경우 최초 1회 자동 생성
      const defaultName = process.env.DEFAULT_WORKSPACE_NAME?.trim() || 'AntiGravity';
      workspace = await globalPrisma.workspace.create({
        data: {
          name: defaultName,
          slug: 'default-workspace',
          dbType: 'postgresql',
          dbUrl: process.env.WORKSPACE_DATABASE_URL || 'postgresql://juyeong:qkrwndud@localhost:5432/workspace',
          ownerId: currentUser.id,
          status: 'ACTIVE',
        },
      });
    }

    // 2. 현재 사용자의 단일 워크스페이스 멤버십 보장
    let userRole = 'MEMBER';
    const isSuperAdmin = currentUser.role === 'ADMIN' || currentUser.email === 'worean@naver.com';
    const isOwner = workspace.ownerId === currentUser.id;

    if (isSuperAdmin || isOwner) {
      userRole = 'OWNER';
    } else {
      try {
        const membership = await globalPrisma.userWorkspace.upsert({
          where: {
            userId_workspaceId: {
              userId: currentUser.id,
              workspaceId: workspace.id,
            },
          },
          update: { status: 'ACTIVE' },
          create: {
            userId: currentUser.id,
            workspaceId: workspace.id,
            role: 'MEMBER',
            status: 'ACTIVE',
          },
        });
        userRole = membership.role;
      } catch (e) {
        userRole = 'MEMBER';
      }
    }

    req.workspace = workspace;
    req.workspaceDb = defaultWorkspacePrisma;
    req.workspaceRole = userRole;

    next();
  } catch (error: any) {
    res.status(500).json({ error: 'Workspace access verification failed', details: error.message });
  }
};

/**
 * 👑 워크스페이스 내 최소 권한 요구 미들웨어 (OWNER > ADMIN > MEMBER > GUEST)
 */
export const requireWorkspaceRole = (minRole: 'OWNER' | 'ADMIN' | 'MEMBER') => {
  const roleHierarchy: Record<string, number> = {
    OWNER: 40,
    ADMIN: 30,
    MEMBER: 20,
    GUEST: 10,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.workspaceRole || 'GUEST';
    const currentLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[minRole] || 20;

    if (currentLevel < requiredLevel) {
      return res.status(403).json({
        error: `Forbidden: Minimum '${minRole}' role required in this workspace`,
      });
    }

    next();
  };
};
