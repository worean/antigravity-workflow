import { globalPrisma } from '#lib/globalPrisma.js';

export const removeWorkspaceMemberService = async (workspaceId: number, targetUserId: number) => {
  if (!workspaceId || !targetUserId) {
    throw new Error('Workspace ID and Target User ID are required');
  }

  const workspace = await globalPrisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  if (workspace.ownerId === targetUserId) {
    throw new Error('Cannot remove the workspace owner');
  }

  await globalPrisma.userWorkspace.deleteMany({
    where: {
      workspaceId,
      userId: targetUserId,
    },
  });

  return { success: true, message: 'Member removed from workspace' };
};
