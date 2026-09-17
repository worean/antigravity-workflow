import { prisma as workspacePrisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';

export const getMeService = async (userId: number) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // 1. Global DB에서 먼저 사용자 정보 조회
  let globalUser = null;
  try {
    globalUser = await globalPrisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        avatarColor: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (e) {}

  // 2. 워크스페이스 DB에서 사용자 정보 및 그룹/환경설정 조회
  const searchWhere = globalUser ? { email: globalUser.email } : { id: userId };
  let workspaceUser = null;
  try {
    workspaceUser = await workspacePrisma.user.findFirst({
      where: searchWhere,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        avatarColor: true,
        pushToken: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
        groupMemberships: {
          include: {
            group: {
              include: {
                parent: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
  } catch (e) {}

  if (!globalUser && !workspaceUser) {
    throw new Error('User not found');
  }

  return {
    id: globalUser ? globalUser.id : workspaceUser!.id,
    email: globalUser ? globalUser.email : workspaceUser!.email,
    name: globalUser ? globalUser.name : workspaceUser!.name,
    role: globalUser ? globalUser.role : workspaceUser!.role,
    avatar: globalUser?.avatar || workspaceUser?.avatar,
    avatarColor: globalUser?.avatarColor || workspaceUser?.avatarColor,
    pushToken: workspaceUser?.pushToken || null,
    preferences: workspaceUser?.preferences || null,
    createdAt: globalUser?.createdAt || workspaceUser?.createdAt,
    updatedAt: globalUser?.updatedAt || workspaceUser?.updatedAt,
    groupMemberships: workspaceUser?.groupMemberships || [],
  };
};
