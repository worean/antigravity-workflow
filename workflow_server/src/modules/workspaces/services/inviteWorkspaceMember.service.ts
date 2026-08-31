// -*- coding: utf-8 -*-
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

export interface InviteWorkspaceMemberParams {
  workspaceId: number;
  email?: string;
  userId?: number;
  role?: string; // ADMIN, MEMBER, GUEST
}

export const inviteWorkspaceMemberService = async (params: InviteWorkspaceMemberParams) => {
  if (!params.workspaceId) {
    throw new Error('Workspace ID is required');
  }

  // 1. 대상 워크스페이스 조회
  const workspace = await globalPrisma.workspace.findUnique({
    where: { id: params.workspaceId },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // 2. 대상 사용자 조회
  let targetUser: any = null;
  if (params.userId) {
    targetUser = await globalPrisma.user.findUnique({ where: { id: params.userId } });
  } else if (params.email) {
    targetUser = await globalPrisma.user.findUnique({ where: { email: params.email.trim() } });
  }

  if (!targetUser) {
    throw new Error('Target user not found');
  }

  const role = params.role || 'MEMBER';

  // 3. Global DB UserWorkspace 등록 (Upsert)
  const membership = await globalPrisma.userWorkspace.upsert({
    where: {
      userId_workspaceId: {
        userId: targetUser.id,
        workspaceId: workspace.id,
      },
    },
    update: {
      role,
      status: 'ACTIVE',
    },
    create: {
      userId: targetUser.id,
      workspaceId: workspace.id,
      role,
      status: 'ACTIVE',
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  // 4. 워크스페이스 테넌트 DB에 사용자 정보 자동 동기화
  await workspaceManager.syncUserToWorkspace(
    {
      id: workspace.id,
      dbUrl: workspace.dbUrl,
      dbType: workspace.dbType,
    },
    {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      avatar: targetUser.avatar,
    }
  );

  return membership;
};
