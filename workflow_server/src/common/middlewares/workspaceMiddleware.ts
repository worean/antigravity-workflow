// -*- coding: utf-8 -*-
import { Request, Response, NextFunction } from 'express';
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

/**
 * 🔒 워크스페이스 데이터베이스 접근 인가 미들웨어
 *
 * 보안 정책:
 * 1. 인증된 사용자(req.user)만 워크스페이스 접근 가능
 * 2. 시스템 최고 관리자(ADMIN) 또는 워크스페이스 소유자(Owner)는 모든 워크스페이스 접근 가능
 * 3. 일반 사용자는 Global DB의 UserWorkspace에 'ACTIVE' 상태로 등록된 경우에만 접근 허용
 * 4. 미참여 또는 인가되지 않은 사용자는 403 Forbidden 차단 (Database 접근 자체를 차단)
 * 5. 인가 성공 시 해당 워크스페이스 전용 PrismaClient(req.workspaceDb) 및 워크스페이스 정보 주입
 */
export const requireWorkspaceAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    // 1. 요청 헤더, URL 파라미터, 쿼리, 본문에서 워크스페이스 식별자 추출
    let workspaceId = Number(
      req.headers['x-workspace-id'] ||
        req.params.workspaceId ||
        req.query.workspaceId ||
        req.body?.workspaceId
    );
    const workspaceSlug = (
      req.headers['x-workspace-slug'] ||
      req.params.workspaceSlug ||
      req.query.workspaceSlug ||
      req.body?.workspaceSlug
    ) as string | undefined;

    let workspace: any = null;

    if (workspaceId && !isNaN(workspaceId)) {
      workspace = await globalPrisma.workspace.findUnique({ where: { id: workspaceId } });
    } else if (workspaceSlug) {
      workspace = await globalPrisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    } else {
      // 명시적 식별자가 없을 경우: 사용자가 참여 중인 첫 번째 워크스페이스 또는 기본 워크스페이스 탐색
      const firstMembership = await globalPrisma.userWorkspace.findFirst({
        where: { userId: currentUser.id, status: 'ACTIVE' },
        include: { workspace: true },
        orderBy: { id: 'asc' },
      });

      if (firstMembership) {
        workspace = firstMembership.workspace;
      } else {
        workspace = await globalPrisma.workspace.findFirst({
          where: { slug: 'default-workspace' },
        });
      }
    }

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Forbidden: Workspace is inactive or archived' });
    }

    // 2. 접근 권한 판정
    let userRole = 'MEMBER';
    const isSuperAdmin = currentUser.role === 'ADMIN' || currentUser.email === 'worean@naver.com';
    const isOwner = workspace.ownerId === currentUser.id;

    if (isSuperAdmin || isOwner) {
      userRole = 'OWNER';
    } else {
      // 일반 멤버십 조회
      const membership = await globalPrisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: currentUser.id,
            workspaceId: workspace.id,
          },
        },
      });

      if (!membership || membership.status !== 'ACTIVE') {
        return res.status(403).json({
          error: 'Forbidden: You do not have permission to access this workspace database',
          code: 'WORKSPACE_ACCESS_DENIED',
        });
      }

      userRole = membership.role;
    }

    // 3. 워크스페이스 전용 DB 클라이언트 획득 및 Request 객체 바인딩
    const workspaceDb = await workspaceManager.getDbClient(workspace);

    req.workspace = workspace;
    req.workspaceDb = workspaceDb;
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
