import { globalPrisma } from '#lib/globalPrisma.js';

export interface UpdateWorkspaceParams {
  name?: string;
  description?: string;
  icon?: string;
}

export const updateWorkspaceService = async (workspaceId: number | undefined, params: UpdateWorkspaceParams) => {
  if (typeof workspaceId === 'number' && workspaceId < 0) {
    throw new Error('Invalid workspace ID');
  }

  let targetWorkspaceId = workspaceId;
  if (!targetWorkspaceId) {
    const activeWorkspace = await globalPrisma.workspace.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' },
    });
    if (!activeWorkspace) {
      throw new Error('Workspace not found');
    }
    targetWorkspaceId = activeWorkspace.id;
  }

  const workspace = await globalPrisma.workspace.update({
    where: { id: targetWorkspaceId },
    data: {
      name: params.name?.trim(),
      description: params.description?.trim(),
      icon: params.icon,
    },
  });

  return workspace;
};
