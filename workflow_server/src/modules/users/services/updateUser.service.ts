import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  avatar?: string | null;
  avatarColor?: string | null;
  pushToken?: string | null;
  preferences?: string | null;
  bio?: string | null;
  department?: string | null;
  jobTitle?: string | null;
}

export const updateUserService = async (id: number, data: UpdateUserInput) => {
  if (!id) throw new Error('User ID is required');

  const updatePayload: any = { ...data };
  if (updatePayload.bio !== undefined) {
    updatePayload.bio = updatePayload.bio ? String(updatePayload.bio).trim() : null;
  }
  if (updatePayload.department !== undefined) {
    updatePayload.department = updatePayload.department ? String(updatePayload.department).trim() : null;
  }
  if (updatePayload.jobTitle !== undefined) {
    updatePayload.jobTitle = updatePayload.jobTitle ? String(updatePayload.jobTitle).trim() : null;
  }

  // 1. Global DB 동기화 시도 (존재할 경우)
  try {
    const globalData: any = {};
    if (updatePayload.name !== undefined) globalData.name = updatePayload.name;
    if (updatePayload.avatar !== undefined) globalData.avatar = updatePayload.avatar;
    if (updatePayload.avatarColor !== undefined) globalData.avatarColor = updatePayload.avatarColor;
    if (updatePayload.preferences !== undefined) globalData.preferences = updatePayload.preferences;
    if (updatePayload.bio !== undefined) globalData.bio = updatePayload.bio;
    if (updatePayload.department !== undefined) globalData.department = updatePayload.department;
    if (updatePayload.jobTitle !== undefined) globalData.jobTitle = updatePayload.jobTitle;

    if (Object.keys(globalData).length > 0) {
      await globalPrisma.user.updateMany({
        where: { id: Number(id) },
        data: globalData,
      });
    }
  } catch (err) {
    console.warn(`[updateUserService] Failed to sync with Global DB for user #${id}:`, err);
  }

  // 2. Workspace DB 업데이트
  return await prisma.user.update({
    where: { id: Number(id) },
    data: updatePayload,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      avatarColor: true,
      pushToken: true,
      preferences: true,
      bio: true,
      department: true,
      jobTitle: true,
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
};


