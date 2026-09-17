import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';

export interface GoogleCalendarStatusDto {
  isGoogleLinked: boolean;
  googleEmail?: string | null;
  lastSyncedAt?: string | null;
  message: string;
}

export const getGoogleCalendarStatusService = async (
  userId: number
): Promise<GoogleCalendarStatusDto> => {
  if (!userId) {
    return {
      isGoogleLinked: false,
      googleEmail: null,
      lastSyncedAt: null,
      message: '로그인이 필요합니다.',
    };
  }

  // 1. Global DB에서 Google SocialAccount 연동 여부 조회
  let googleAccount: any = null;
  try {
    googleAccount = await globalPrisma.socialAccount.findFirst({
      where: {
        userId,
        provider: 'GOOGLE',
      },
    });
  } catch {}

  // 2. 워크스페이스 DB에서도 fallback 확인
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

  if (!googleAccount) {
    return {
      isGoogleLinked: false,
      googleEmail: null,
      lastSyncedAt: null,
      message: 'Google 계정으로 로그인한 유저만 Google 캘린더 연동을 이용할 수 있습니다.',
    };
  }

  return {
    isGoogleLinked: true,
    googleEmail: googleAccount.email || null,
    lastSyncedAt: googleAccount.updatedAt ? googleAccount.updatedAt.toISOString() : null,
    message: 'Google 캘린더 연동이 활성화되어 있습니다.',
  };
};
