import { globalPrisma } from '#lib/globalPrisma.js';

export const getInvitationsService = async (workspaceId: number) => {
  if (!workspaceId) throw new Error('Workspace ID is required');

  const invitations = await globalPrisma.workspaceInvitation.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return invitations;
};

export const deleteInvitationService = async (workspaceId: number, invitationId: number) => {
  if (!workspaceId || !invitationId) throw new Error('Workspace ID and Invitation ID are required');

  await globalPrisma.workspaceInvitation.deleteMany({
    where: {
      id: invitationId,
      workspaceId,
    },
  });

  return { success: true, message: '초대장이 취소되었습니다.' };
};
