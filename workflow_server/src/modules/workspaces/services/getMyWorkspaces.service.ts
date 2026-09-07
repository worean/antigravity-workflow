import { globalPrisma } from '#lib/globalPrisma.js';

export const getMyWorkspacesService = async (userId: number) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // 단일 워크스페이스 구조: 항상 활성화된 단일 워크스페이스를 조회하여 단일 요소 배열로 반환
  let defaultWs = await globalPrisma.workspace.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { id: 'asc' },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  if (!defaultWs) {
    const defaultName = process.env.DEFAULT_WORKSPACE_NAME?.trim() || 'AntiGravity';
    defaultWs = await globalPrisma.workspace.create({
      data: {
        name: defaultName,
        slug: 'default-workspace',
        dbType: 'postgresql',
        dbUrl: process.env.WORKSPACE_DATABASE_URL || 'postgresql://juyeong:qkrwndud@localhost:5432/workspace',
        ownerId: userId,
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  // 사용자 멤버십 확인/등록
  const membership = await globalPrisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: defaultWs.id,
      },
    },
  });

  const myRole = (defaultWs.ownerId === userId) ? 'OWNER' : (membership?.role || 'MEMBER');

  return [
    {
      id: defaultWs.id,
      slug: defaultWs.slug,
      name: defaultWs.name,
      description: defaultWs.description,
      icon: defaultWs.icon,
      ownerId: defaultWs.ownerId,
      dbType: defaultWs.dbType,
      status: defaultWs.status,
      myRole,
      memberCount: defaultWs._count?.members || 1,
      joinedAt: membership?.joinedAt || defaultWs.createdAt,
      createdAt: defaultWs.createdAt,
      updatedAt: defaultWs.updatedAt,
    },
  ];
};
