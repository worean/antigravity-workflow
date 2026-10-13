import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { broadcastGlobal } from '#lib/socket.js';

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

  // 대상 유저 식별 (ID 또는 Email 기준으로 Global/Workspace 양쪽 유저 확인)
  let targetEmail: string | undefined = undefined;
  try {
    const foundWorkspaceUser = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (foundWorkspaceUser?.email) {
      targetEmail = foundWorkspaceUser.email;
    } else {
      const foundGlobalUser = await globalPrisma.user.findUnique({ where: { id: Number(id) } });
      if (foundGlobalUser?.email) {
        targetEmail = foundGlobalUser.email;
      }
    }
  } catch (err) {
    // ignore
  }

  // 1. Global DB 동기화 (전역 사용자 및 채팅 시스템의 Single Source of Truth)
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
      const globalConditions: any[] = [{ id: Number(id) }];
      if (targetEmail) {
        globalConditions.push({ email: targetEmail });
      }

      await globalPrisma.user.updateMany({
        where: { OR: globalConditions },
        data: globalData,
      });
    }
  } catch (err) {
    console.warn(`[updateUserService] Failed to sync with Global DB for user #${id}:`, err);
  }

  // 2. Workspace DB 업데이트 (ID 또는 Email 매칭 레코드 안전 갱신)
  let updatedWorkspaceUser: any = null;
  try {
    const wsConditions: any[] = [{ id: Number(id) }];
    if (targetEmail) {
      wsConditions.push({ email: targetEmail });
    }

    await prisma.user.updateMany({
      where: { OR: wsConditions },
      data: updatePayload,
    });

    updatedWorkspaceUser = await prisma.user.findFirst({
      where: { OR: wsConditions },
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
  } catch (err) {
    console.warn(`[updateUserService] Workspace DB update warning:`, err);
  }

  // Fallback: Workspace DB 조회가 없을 경우 Global DB 결과로 응답
  if (!updatedWorkspaceUser) {
    const gUser = await globalPrisma.user.findFirst({
      where: { OR: [{ id: Number(id) }, ...(targetEmail ? [{ email: targetEmail }] : [])] },
    });
    updatedWorkspaceUser = gUser ? { ...gUser, groupMemberships: [] } : { id: Number(id), ...updatePayload };
  }

  // 3. 🚀 전역 실시간 소켓 브로드캐스트 (채팅방 및 모든 활성 탭에 최신 아바타/프로필 실시간 통보)
  try {
    broadcastGlobal('chat:user_updated', {
      userId: updatedWorkspaceUser.id,
      email: updatedWorkspaceUser.email,
      name: updatedWorkspaceUser.name,
      avatar: updatedWorkspaceUser.avatar,
      avatarColor: updatedWorkspaceUser.avatarColor,
      department: updatedWorkspaceUser.department,
      jobTitle: updatedWorkspaceUser.jobTitle,
      bio: updatedWorkspaceUser.bio,
    });
  } catch (e) {
    // 소켓 브로드캐스트 실패는 무시
  }

  return updatedWorkspaceUser;
};
