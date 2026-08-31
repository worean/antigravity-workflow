// -*- coding: utf-8 -*-
import { globalPrisma } from '#lib/globalPrisma.js';

export interface UpdateWorkspaceParams {
  name?: string;
  description?: string;
  icon?: string;
}

export const updateWorkspaceService = async (workspaceId: number, params: UpdateWorkspaceParams) => {
  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  const workspace = await globalPrisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name: params.name?.trim(),
      description: params.description?.trim(),
      icon: params.icon,
    },
  });

  return workspace;
};
