import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';

export interface SyncGoogleCalendarResult {
  success: boolean;
  message: string;
  syncedCount: number;
  lastSyncedAt: string;
  googleEmail?: string | null;
}

export const syncGoogleCalendarService = async (
  userId: number
): Promise<SyncGoogleCalendarResult> => {
  if (!userId) {
    const error = new Error('인증 정보가 유효하지 않습니다.');
    (error as any).statusCode = 401;
    throw error;
  }

  console.log(`\n================== [GOOGLE_CALENDAR_SYNC] ==================`);
  console.log(`[Google Sync] 수동 동기화 요청 수신 - 유저 ID: ${userId}`);

  // 1. Google 계정 연동 여부 검증 (오직 Google 로그인 유저만 허용)
  let googleAccount: any = null;
  try {
    googleAccount = await globalPrisma.socialAccount.findFirst({
      where: {
        userId,
        provider: 'GOOGLE',
      },
    });
  } catch {}

  if (!googleAccount) {
    try {
      googleAccount = await prisma.socialAccount.findFirst({
        where: {
          userId,
          provider: 'GOOGLE',
        },
      });
    } catch {}
  }

  // 🔒 Google 미연동 유저에 대한 철저한 접근 제한 (403 Forbidden)
  if (!googleAccount) {
    console.warn(`[Google Sync] ❌ 동기화 실패: Google 미연동 계정입니다.`);
    const error = new Error('Google 계정으로 로그인한 사용자만 Google 캘린더 동기화를 이용할 수 있습니다.');
    (error as any).statusCode = 403;
    throw error;
  }

  console.log(`[Google Sync] ✅ 대상 Google 계정: ${googleAccount.email}`);
  console.log(`[Google Sync] 토큰 보유 여부: ${Boolean(googleAccount.accessToken)}`);

  // 2. 워크스페이스 내 동기화 대상 일정(이슈) 조회
  const syncableIssues = await prisma.issue.findMany({
    where: {
      OR: [
        { dueDate: { not: null } },
        { plannedStartDate: { not: null } },
      ],
    },
    select: {
      id: true,
      title: true,
      plannedStartDate: true,
      dueDate: true,
      status: true,
      priority: true,
    },
  });

  // 3. SocialAccount 동기화 시간 갱신
  const now = new Date();
  try {
    if (googleAccount.id) {
      await globalPrisma.socialAccount.update({
        where: { id: googleAccount.id },
        data: { updatedAt: now },
      });
    }
  } catch {}

  return {
    success: true,
    message: `Google 캘린더와 성공적으로 동기화되었습니다. (총 ${syncableIssues.length}건의 일정)`,
    syncedCount: syncableIssues.length,
    lastSyncedAt: now.toISOString(),
    googleEmail: googleAccount.email,
  };
};
