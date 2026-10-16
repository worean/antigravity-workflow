import { globalPrisma } from '#lib/globalPrisma.js';

async function resolveActiveWorkspaceId(workspaceId?: number): Promise<number> {
  if (workspaceId && workspaceId > 0) {
    return workspaceId;
  }
  const activeWorkspace = await globalPrisma.workspace.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { id: 'asc' },
  });
  if (!activeWorkspace) {
    throw new Error('Workspace not found');
  }
  return activeWorkspace.id;
}

export const getInvitationsService = async (workspaceId?: number) => {
  const targetWorkspaceId = await resolveActiveWorkspaceId(workspaceId);

  const invitations = await globalPrisma.workspaceInvitation.findMany({
    where: { workspaceId: targetWorkspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return invitations;
};

export const deleteInvitationService = async (workspaceId: number | undefined, invitationId: number) => {
  if (!invitationId) throw new Error('Invitation ID is required');
  const targetWorkspaceId = await resolveActiveWorkspaceId(workspaceId);

  await globalPrisma.workspaceInvitation.deleteMany({
    where: {
      id: invitationId,
      workspaceId: targetWorkspaceId,
    },
  });

  return { success: true, message: '초대장이 취소되었습니다.' };
};
