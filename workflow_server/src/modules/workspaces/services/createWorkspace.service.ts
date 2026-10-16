import { globalPrisma } from '#lib/globalPrisma.js';

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
export const createWorkspaceService = async (
  user: { id: number; email?: string; role?: string; name?: string | null },
  params: CreateWorkspaceParams
) => {
  if (!params.name || !params.name.trim()) {
    throw new Error('Workspace name is required');
  }

  const existing = await globalPrisma.workspace.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { id: 'asc' },
  });

  if (existing) {
    // 단일 워크스페이스 정책: 이미 존재하는 경우 메타데이터/소유자 갱신 및 호출자의 OWNER 멤버십 보장
    const updated = await globalPrisma.workspace.update({
      where: { id: existing.id },
      data: {
        name: params.name.trim(),
        description: params.description !== undefined ? params.description?.trim() : existing.description,
        icon: params.icon !== undefined ? params.icon : existing.icon,
        ownerId: user.id,
      },
    });

    await globalPrisma.userWorkspace.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: existing.id,
        },
      },
      update: { role: 'OWNER', status: 'ACTIVE' },
      create: {
        userId: user.id,
        workspaceId: existing.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    return updated;
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
