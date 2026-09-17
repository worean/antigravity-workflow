﻿﻿import { globalPrisma } from '#lib/globalPrisma.js';


export interface CreateWorkspaceParams {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
}

/**
 * 🏢 워크스페이스 생성/초기화 서비스
 * 단일 워크스페이스 구조에서는 이미 워크스페이스가 존재하면 새로 생성하지 않고
 * 기존 단일 워크스페이스를 반환하거나 필요 시 메타데이터를 갱신합니다.
 */
export const createWorkspaceService = async (user: { id: number; email?: string; role?: string; name?: string | null }, params: CreateWorkspaceParams) => {
  if (!params.name || !params.name.trim()) {
    throw new Error('Workspace name is required');
  }

  const existing = await globalPrisma.workspace.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { id: 'asc' },
  });

  if (existing) {
    // 단일 워크스페이스 정책: 이미 존재하는 경우 기존 워크스페이스 반환
    return existing;
  }

  const dbUrl = process.env.WORKSPACE_DATABASE_URL || 'postgresql://juyeong:qkrwndud@localhost:5432/workspace';
  const defaultSlug = params.slug?.trim() || 'default-workspace';

  const workspace = await globalPrisma.workspace.create({
    data: {
      name: params.name.trim(),
      slug: defaultSlug,
      description: params.description?.trim(),
      icon: params.icon,
      ownerId: user.id,
      dbType: 'postgresql',
      dbUrl,
      status: 'ACTIVE',
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      },
    },
  });

  return workspace;
};
