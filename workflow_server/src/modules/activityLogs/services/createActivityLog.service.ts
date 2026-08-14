import { prisma } from '#lib/prisma.js';

export interface CreateActivityLogParams {
  action: string;
  entityType: string;
  entityId?: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  summary?: string;
  details?: string | Record<string, any> | null;
  ipAddress?: string;
}

export const createActivityLogService = async (params: CreateActivityLogParams) => {
  const {
    action,
    entityType,
    entityId,
    userId,
    userName: inputName,
    userEmail: inputEmail,
    summary,
    details,
    ipAddress
  } = params;

  if (!action || !entityType) {
    throw new Error('action and entityType are required for activity log');
  }

  let finalUserName = inputName;
  let finalUserEmail = inputEmail;

  // 사용자 ID가 주어졌으나 이름/이메일이 없는 경우, 비관계형 스냅샷을 위해 유저 정보 조회
  if (userId && (!finalUserName || !finalUserEmail)) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });
      if (user) {
        finalUserName = finalUserName || user.name || undefined;
        finalUserEmail = finalUserEmail || user.email;
      }
    } catch {
      // 로깅 실패가 주 트랜잭션/흐름을 중단하지 않도록 안전 무시
    }
  }

  const detailsString = details
    ? typeof details === 'string'
      ? details
      : JSON.stringify(details)
    : null;

  return await prisma.activityLog.create({
    data: {
      action,
      entityType,
      entityId: entityId ? Number(entityId) : undefined,
      userId: userId ? Number(userId) : undefined,
      userName: finalUserName,
      userEmail: finalUserEmail,
      summary,
      details: detailsString,
      ipAddress
    }
  });
};
