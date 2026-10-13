import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';

export interface GoogleCalendarItemDto {
  id: string;
  summary: string;
  description?: string | null;
  primary?: boolean;
  backgroundColor?: string | null;
  timeZone?: string | null;
}

export interface GetGoogleCalendarsResult {
  success: boolean;
  isTokenExpired?: boolean;
  calendars: GoogleCalendarItemDto[];
  matchedWorkCalendarId?: string | null;
  message?: string;
}

export const getGoogleCalendarsService = async (
  userId: number
): Promise<GetGoogleCalendarsResult> => {
  if (!userId) {
    return { success: false, calendars: [], message: '인증 정보가 필요합니다.' };
  }

  let googleAccount: any = null;
  try {
    googleAccount = await globalPrisma.socialAccount.findFirst({
      where: { userId: Number(userId), provider: 'GOOGLE' },
    });
  } catch {}

  if (!googleAccount) {
    try {
      googleAccount = await prisma.socialAccount.findFirst({
        where: { userId: Number(userId), provider: 'GOOGLE' },
      });
    } catch {}
  }

  if (!googleAccount || !googleAccount.accessToken) {
    return {
      success: false,
      calendars: [],
      message: '연동된 Google 계정이 없거나 Access Token이 없습니다.',
    };
  }

  try {
    console.log(`[Google CalendarList] 🌐 사용자의 구글 캘린더 목록(/users/me/calendarList) 조회 중...`);
    const gRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${googleAccount.accessToken}`,
      },
    });

    console.log(`[Google CalendarList] 📥 응답 상태: ${gRes.status} ${gRes.statusText}`);

    if (gRes.status === 401) {
      console.warn(`[Google CalendarList] ⚠️ Google Access Token이 만료되었습니다. (401 Unauthorized)`);
      return {
        success: false,
        isTokenExpired: true,
        calendars: [
          { id: 'work', summary: '직장 (Google 캘린더)', primary: false },
          { id: 'primary', summary: '기본 (개인 캘린더)', primary: true },
        ],
        matchedWorkCalendarId: 'work',
        message: 'Google Access Token이 만료되었습니다. Google 재로그인이 필요합니다.',
      };
    }

    if (!gRes.ok) {
      const errText = await gRes.text();
      console.error(`[Google CalendarList] ❌ 캘린더 목록 조회 실패:`, errText);
      return {
        success: false,
        calendars: [],
        message: `Google API 호출 실패 (${gRes.status})`,
      };
    }

    const data = await gRes.json();
    const items: any[] = Array.isArray(data.items) ? data.items : [];

    const calendars: GoogleCalendarItemDto[] = items.map((c) => ({
      id: c.id,
      summary: c.summary || '(이름 없는 캘린더)',
      description: c.description || null,
      primary: Boolean(c.primary),
      backgroundColor: c.backgroundColor || null,
      timeZone: c.timeZone || null,
    }));

    // "직장" 또는 "Work", "업무", "회사" 캘린더 자동 매칭
    const workCal = calendars.find((c) =>
      c.summary.includes('직장') ||
      c.summary.toLowerCase().includes('work') ||
      c.summary.includes('회사') ||
      c.summary.includes('업무')
    );

    console.log(`[Google CalendarList] ✅ 조회된 총 캘린더 수: ${calendars.length}개`);
    calendars.forEach((c, idx) => {
      console.log(`  [${idx + 1}] "${c.summary}" (ID: ${c.id}, primary: ${c.primary})`);
    });

    if (workCal) {
      console.log(`[Google CalendarList] 🎯 "직장" 관련 캘린더 자동 감지 성공: "${workCal.summary}" (ID: ${workCal.id})`);
    }

    return {
      success: true,
      calendars,
      matchedWorkCalendarId: workCal ? workCal.id : (calendars.find((c) => c.primary)?.id || 'primary'),
      message: `${calendars.length}개의 Google 캘린더를 찾았습니다.`,
    };
  } catch (err: any) {
    console.error(`[Google CalendarList] 💥 네트워크/요청 오류:`, err);
    return {
      success: false,
      calendars: [],
      message: err.message || '캘린더 목록을 가져오지 못했습니다.',
    };
  }
};
