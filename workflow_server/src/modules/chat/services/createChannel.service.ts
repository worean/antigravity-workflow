import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma as workspacePrisma } from '#lib/prisma.js';

export interface CreateChannelDTO {
  userId: number;
  name?: string;
  type?: 'GLOBAL' | 'GENERAL' | 'PROJECT' | 'GROUP' | 'DM' | string;
  topic?: string;
  icon?: string;
  isPrivate?: boolean;
  workspaceId?: number;
  projectId?: number | string;
  groupId?: number | string;
  memberUserIds?: (number | string)[];
  targetUserId?: number | string;
}

export const createChannelService = async (
  data: CreateChannelDTO,
  customDb?: any,
  customWorkspaceDb?: any
) => {
  const {
    userId,
    topic,
    icon,
    isPrivate = false,
    workspaceId,
  } = data;
  const gdb = (customDb ?? globalPrisma) as any;
  const wdb = (customWorkspaceDb ?? workspacePrisma) as any;

  if (!userId) throw new Error('User ID is required');

  // 워크스페이스 ID 식별 및 Fallback (단위 테스트 및 레거시 호환)
  let effectiveWorkspaceId = workspaceId ? Number(workspaceId) : undefined;
  if (!effectiveWorkspaceId) {
    const defaultWs = await gdb.workspace.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' },
    });
    effectiveWorkspaceId = defaultWs?.id;
  }
  if (!effectiveWorkspaceId) {
    throw new Error('Workspace ID is required for all channels including DM');
  }

  const rawType = String(data.type || 'GENERAL').toUpperCase();
  const numericProjectId = data.projectId ? Number(data.projectId) : undefined;
  const numericGroupId = data.groupId ? Number(data.groupId) : undefined;
  const numericTargetUserId = data.targetUserId ? Number(data.targetUserId) : undefined;
  const numericMemberIds = Array.isArray(data.memberUserIds)
    ? data.memberUserIds.map((id) => Number(id)).filter((id) => !isNaN(id))
    : [];

  let finalName = (data.name || '').trim();
  let finalTopic = (topic || '').trim();
  let finalIcon = (icon || '').trim();

  // 1. DM 생성 처리
  if (rawType === 'DM') {
    const otherId = numericTargetUserId || numericMemberIds.find((id) => id !== userId);
    if (!otherId) throw new Error('Target User ID is required for DM');

    // 상대방 유저가 Global DB에 존재하는지 확인
    const otherUser = await gdb.user.findUnique({ where: { id: otherId } });
    if (!otherUser) {
      throw new Error(`Target user #${otherId} does not exist`);
    }

    // 현재 Workspace 내에서 동일 유저 간 DM 채널 검색
    const existingDm = await gdb.chatChannel.findFirst({
      where: {
        type: 'DM',
        workspaceId: effectiveWorkspaceId,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: otherId } } },
        ],
      },
      include: {
        members: { include: { user: true } },
      },
    });

    if (existingDm) return existingDm;

    let dmName = finalName;
    if (!dmName) {
      dmName = otherUser.name || otherUser.email || `DM_${userId}_${otherId}`;
    }

    return await gdb.chatChannel.create({
      data: {
        name: dmName,
        type: 'DM',
        isPrivate: true,
        workspaceId: effectiveWorkspaceId,
        members: {
          create: [
            { userId, role: 'OWNER' },
            { userId: otherId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });
  }

  // 2. PROJECT 채널 처리 (이름/토픽/아이콘 자동 보정)
  if (rawType === 'PROJECT') {
    if (!finalIcon) finalIcon = '📁';
    if (numericProjectId && (!finalName || !finalTopic)) {
      try {
        const proj = await wdb.project.findUnique({ where: { id: numericProjectId } });
        if (proj) {
          if (!finalName) finalName = proj.name;
          if (!finalTopic) finalTopic = `${proj.name} (${proj.key || `PRJ-${proj.id}`}) 프로젝트 전용 대화방`;
        }
      } catch (e) {
        // fallback
      }
    }
    if (!finalName) {
      finalName = numericProjectId ? `프로젝트 #${numericProjectId}` : '프로젝트 대화방';
    }
  }

  // 3. GROUP 채널 처리 (이름/토픽/아이콘 자동 보정)
  else if (rawType === 'GROUP') {
    if (!finalIcon) finalIcon = '👥';
    if (numericGroupId && (!finalName || !finalTopic)) {
      try {
        const grp = await wdb.group.findUnique({ where: { id: numericGroupId } });
        if (grp) {
          if (!finalName) finalName = grp.name;
          if (!finalTopic) finalTopic = `${grp.name} 그룹 전용 대화방`;
        }
      } catch (e) {
        // fallback
      }
    }
    if (!finalName) {
      finalName = numericGroupId ? `그룹 #${numericGroupId}` : '그룹 대화방';
    }
  }

  // 4. GENERAL / 기타 채널 처리
  else {
    if (!finalName) {
      finalName = '새 대화방';
    }
    if (!finalIcon) finalIcon = '💬';
  }

  // 멤버 목록 구성 (생성자 포함)
  const memberSet = new Set<number>([userId]);
  for (const id of numericMemberIds) {
    if (id) memberSet.add(id);
  }

  // 만약 PROJECT 채널인 경우 프로젝트 멤버들도 자동 참여
  if (rawType === 'PROJECT' && numericProjectId) {
    try {
      const projMembers = await wdb.projectMember.findMany({
        where: { projectId: numericProjectId },
        select: { userId: true },
      });
      for (const pm of projMembers) {
        if (pm.userId) memberSet.add(pm.userId);
      }
    } catch (e) {
      // ignore
    }
  }

  // 🔒 Global DB User 테이블에 실제 존재하는 유저만 필터링 (FK Constraint Violated 원천 방어)
  const candidateIds = Array.from(memberSet);
  const existingUsers = await gdb.user.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true },
  });
  const validUserIds = new Set<number>(existingUsers.map((u: any) => u.id));

  // 생성자는 항상 포함되어야 함
  validUserIds.add(userId);

  // 채널 생성
  const channel = await gdb.chatChannel.create({
    data: {
      name: finalName,
      type: rawType,
      topic: finalTopic || null,
      icon: finalIcon || null,
      isPrivate,
      workspaceId: effectiveWorkspaceId,
      projectId: numericProjectId || null,
      groupId: numericGroupId || null,
      members: {
        create: Array.from(validUserIds).map((mId) => ({
          userId: mId,
          role: mId === userId ? 'OWNER' : 'MEMBER',
        })),
      },
    },
    include: {
      members: { include: { user: true } },
    },
  });

  return channel;
};
