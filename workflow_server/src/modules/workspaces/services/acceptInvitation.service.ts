// -*- coding: utf-8 -*-
import { globalPrisma } from '#lib/globalPrisma.js';
import { workspaceManager } from '#lib/workspaceManager.js';

export const acceptInvitationService = async (inviteToken: string, currentUser: { id: number; email: string; name?: string | null; role?: string }) => {
  if (!inviteToken || !inviteToken.trim()) {
    throw new Error('초대 토큰이 필요합니다.');
  }

  const invitation = await globalPrisma.workspaceInvitation.findUnique({
    where: { inviteToken: inviteToken.trim() },
    include: { workspace: true },
  });

  if (!invitation) {
    throw new Error('유효하지 않거나 만료된 초대장입니다.');
  }

  if (new Date() > invitation.expiresAt) {
    await globalPrisma.workspaceInvitation.delete({ where: { id: invitation.id } });
    throw new Error('초대장 유효기간이 만료되었습니다.');
  }

  const workspace = invitation.workspace;

  // 1. UserWorkspace 등록
  const membership = await globalPrisma.userWorkspace.upsert({
    where: {
      userId_workspaceId: {
        userId: currentUser.id,
        workspaceId: workspace.id,
      },
    },
    update: {
      role: invitation.role,
      status: 'ACTIVE',
    },
    create: {
      userId: currentUser.id,
      workspaceId: workspace.id,
      role: invitation.role,
      status: 'ACTIVE',
    },
  });

  // 2. 테넌트 DB 유저 동기화
  await workspaceManager.syncUserToWorkspace(workspace, currentUser);

  // 3. 사용된 초대장 삭제
  await globalPrisma.workspaceInvitation.delete({ where: { id: invitation.id } });

  return {
    success: true,
    workspace,
    membership,
    message: `'${workspace.name}' 워크스페이스에 성공적으로 참가했습니다.`,
  };
};
