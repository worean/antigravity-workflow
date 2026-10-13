import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';

export interface CalendarEventDto {
  id: string;
  issueId?: number;
  sprintId?: number;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status?: string;
  priority?: string;
  type: 'issue' | 'sprint' | 'google' | 'caldav';
  source?: 'workflow' | 'google' | 'caldav';
  htmlLink?: string | null;
  location?: string | null;
  project?: {
    id: number;
    name: string;
    key?: string;
    color?: string | null;
  };
  assignee?: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
  reporter?: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
}

export interface GetCalendarEventsFilter {
  projectId?: number;
  startDate?: string;
  endDate?: string;
  userId?: number;
  onlyMyEvents?: boolean;
  googleCalendarId?: string;
}

export const getCalendarEventsService = async (
  filter: GetCalendarEventsFilter = {}
): Promise<CalendarEventDto[]> => {
  const { projectId, startDate, endDate, userId, onlyMyEvents, googleCalendarId } = filter;

  // 1. 이슈 조회 필터 조건 구성 (AND 결합)
  const andConditions: any[] = [];

  if (projectId) {
    andConditions.push({ projectId: Number(projectId) });
  }

  // 담당자(assignee) 또는 작성자/보고자(author)가 나인 경우 필터링
  if (onlyMyEvents && userId) {
    andConditions.push({
      OR: [
        { assigneeId: Number(userId) },
        { authorId: Number(userId) },
      ],
    });
  }

  // 날짜 범위 필터링
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    andConditions.push({
      OR: [
        {
          dueDate: {
            gte: start,
            lte: end,
          },
        },
        {
          plannedStartDate: {
            gte: start,
            lte: end,
          },
        },
        {
          AND: [
            { plannedStartDate: { lte: end } },
            { dueDate: { gte: start } },
          ],
        },
      ],
    });
  }

  const issueWhere: any = andConditions.length > 0 ? { AND: andConditions } : {};

  const issues = await prisma.issue.findMany({
    where: issueWhere,
    include: {
      type: true,
      priority: true,
      status: true,
      project: {
        select: { id: true, name: true, key: true },
      },
      assignee: {
        select: { id: true, name: true, avatar: true },
      },
      author: {
        select: { id: true, name: true, avatar: true },
      },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  const events: CalendarEventDto[] = [];

  // 이슈 이벤트 변환
  for (const issue of issues) {
    const start = issue.plannedStartDate
      ? issue.plannedStartDate.toISOString()
      : (issue.dueDate ? issue.dueDate.toISOString() : issue.createdAt.toISOString());
    const end = issue.dueDate
      ? issue.dueDate.toISOString()
      : start;

    events.push({
      id: `issue-${issue.id}`,
      issueId: issue.id,
      title: issue.title,
      description: issue.description,
      startDate: start,
      endDate: end,
      status: issue.status?.name || 'TODO',
      priority: issue.priority?.name || 'MEDIUM',
      type: 'issue',
      source: 'workflow',
      project: issue.project ? {
        id: issue.project.id,
        name: issue.project.name,
        key: issue.project.key,
      } : undefined,
      assignee: issue.assignee ? {
        id: issue.assignee.id,
        name: issue.assignee.name || '미배정',
        avatar: issue.assignee.avatar,
      } : null,
      reporter: issue.author ? {
        id: issue.author.id,
        name: issue.author.name || '알 수 없음',
        avatar: issue.author.avatar,
      } : null,
    });
  }

  // 2. 스프린트 조회 (내 일정만 보기 모드가 아닐 때만 포함)
  if (!onlyMyEvents) {
    const sprintWhere: any = {};
    if (projectId) {
      sprintWhere.projectId = Number(projectId);
    }

    const sprints = await prisma.sprint.findMany({
      where: sprintWhere,
      include: {
        project: {
          select: { id: true, name: true, key: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    for (const sprint of sprints) {
      if (sprint.startDate && sprint.endDate) {
        events.push({
          id: `sprint-${sprint.id}`,
          sprintId: sprint.id,
          title: `[스프린트] ${sprint.name}`,
          startDate: sprint.startDate.toISOString(),
          endDate: sprint.endDate.toISOString(),
          status: sprint.status,
          type: 'sprint',
          source: 'workflow',
          project: sprint.project ? {
            id: sprint.project.id,
            name: sprint.project.name,
            key: sprint.project.key,
          } : undefined,
        });
      }
    }
  }

  // 3. Google Calendar 일정 연동 (오직 Google 연동된 유저만)
  if (userId) {
    console.log(`\n================== [GOOGLE_CALENDAR_DEBUG] ==================`);
    console.log(`[Google Calendar] 일정 조회 요청 시작 - 유저 ID: ${userId}`);

    try {
      let googleAccount: any = null;
      try {
        googleAccount = await globalPrisma.socialAccount.findFirst({
          where: { userId: Number(userId), provider: 'GOOGLE' },
        });
      } catch (err: any) {
        console.warn(`[Google Calendar] Global DB 조회 중 경고: ${err.message}`);
      }

      if (!googleAccount) {
        try {
          googleAccount = await prisma.socialAccount.findFirst({
            where: { userId: Number(userId), provider: 'GOOGLE' },
          });
        } catch (err: any) {
          console.warn(`[Google Calendar] Workspace DB 조회 중 경고: ${err.message}`);
        }
      }

      if (!googleAccount) {
        console.log(`[Google Calendar] ℹ️ 연동된 Google 계정이 없습니다 (일반 이메일 로그인 유저).`);
      } else {
        console.log(`[Google Calendar] ✅ 연동된 Google 계정 확인: ${googleAccount.email} (Provider: ${googleAccount.provider})`);
        const tokenPrefix = googleAccount.accessToken ? `${googleAccount.accessToken.slice(0, 20)}...` : '(토큰 없음)';
        console.log(`[Google Calendar] AccessToken 상태: ${googleAccount.accessToken ? '존재함' : '없음'} (${tokenPrefix})`);

        let googleItems: any[] = [];
        let targetCalTitle = '직장';

        // 실제 Google Calendar API 호출 시도
        if (googleAccount.accessToken) {
          try {
            // 1단계: 사용자의 Google 캘린더 목록(calendarList) 조회하여 "직장" 달력 우선 탐색
            let targetCalId = googleCalendarId || 'primary';

            try {
              console.log(`[Google Calendar API] 📋 전체 캘린더 목록(/users/me/calendarList) 탐색 시작...`);
              const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: { Authorization: `Bearer ${googleAccount.accessToken}` },
              });

              if (listRes.ok) {
                const listData = await listRes.json();
                const cList: any[] = Array.isArray(listData.items) ? listData.items : [];
                console.log(`[Google Calendar API] 📋 총 ${cList.length}개의 구글 달력 발견:`);
                cList.forEach((c: any, idx: number) => {
                  console.log(`   [${idx + 1}] "${c.summary}" (ID: ${c.id}, primary: ${Boolean(c.primary)})`);
                });

                if (!googleCalendarId) {
                  // "직장", "업무", "Work", "회사" 캘린더 자동 매칭 우선순위 적용
                  const workCal = cList.find((c: any) =>
                    (c.summary || '').includes('직장') ||
                    (c.summary || '').toLowerCase().includes('work') ||
                    (c.summary || '').includes('업무') ||
                    (c.summary || '').includes('회사')
                  );

                  if (workCal) {
                    targetCalId = workCal.id;
                    targetCalTitle = workCal.summary;
                    console.log(`[Google Calendar API] 🎯 "직장" 달력 매칭 성공! -> "${workCal.summary}" (ID: ${workCal.id})`);
                  } else {
                    const primaryCal = cList.find((c: any) => c.primary);
                    targetCalId = primaryCal ? primaryCal.id : 'primary';
                    targetCalTitle = primaryCal?.summary || '기본 캘린더';
                    console.log(`[Google Calendar API] ℹ️ "직장" 달력이 없어 기본 캘린더("${targetCalTitle}")로 설정합니다.`);
                  }
                } else {
                  const matched = cList.find((c: any) => c.id === googleCalendarId);
                  targetCalTitle = matched?.summary || googleCalendarId;
                }
              } else {
                console.warn(`[Google Calendar API] ⚠️ 캘린더 목록 조회 HTTP 상태: ${listRes.status}`);
              }
            } catch (listErr: any) {
              console.warn(`[Google Calendar API] ⚠️ 캘린더 목록 탐색 오류 (기본값 진행):`, listErr.message);
            }

            // 2단계: 대상 캘린더(직장 달력 등)의 일정 조회
            const timeMin = startDate
              ? new Date(startDate).toISOString()
              : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const timeMax = endDate
              ? new Date(endDate).toISOString()
              : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
            const gUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

            console.log(`[Google Calendar API] 🌐 "${targetCalTitle}" 캘린더 일정 v3 API 호출...`);
            console.log(`[Google Calendar API] URL: ${gUrl}`);

            const gRes = await fetch(gUrl, {
              headers: {
                Authorization: `Bearer ${googleAccount.accessToken}`,
              },
            });

            console.log(`[Google Calendar API] 📥 HTTP 응답 수신: ${gRes.status} ${gRes.statusText}`);

            const responseText = await gRes.text();
            let gData: any = null;
            try {
              gData = JSON.parse(responseText);
            } catch {
              gData = { raw: responseText };
            }

            if (gRes.ok) {
              if (Array.isArray(gData.items)) {
                googleItems = gData.items;
                console.log(`[Google Calendar API] 🎉 "${targetCalTitle}" 캘린더에서 총 ${googleItems.length}개의 실제 일정을 수신했습니다.`);
                googleItems.slice(0, 5).forEach((item: any, idx: number) => {
                  const sTime = item.start?.dateTime || item.start?.date;
                  console.log(`  [${idx + 1}] "${item.summary || '(제목 없음)'}" (${sTime})`);
                });
              } else {
                console.warn(`[Google Calendar API] ⚠️ items 배열 형태가 다릅니다:`, gData);
              }
            } else {
              console.error(`[Google Calendar API] ❌ API 호출 실패! 상태 코드: ${gRes.status}`);
              console.error(`[Google Calendar API] ❌ 에러 응답 내용:`, JSON.stringify(gData, null, 2));
              if (gRes.status === 401) {
                console.warn(`[Google Calendar API] 💡 원인 진단: Google Access Token이 만료되었습니다. (Google 재로그인 필요)`);
              } else if (gRes.status === 403) {
                console.warn(`[Google Calendar API] 💡 원인 진단: Google Calendar 권한(Scope)이 부족하거나 비공개 캘린더입니다.`);
              }
            }
          } catch (apiErr: any) {
            console.error(`[Google Calendar API] 💥 네트워크/요청 에러 발생:`, apiErr.message || apiErr);
          }
        } else {
          console.warn(`[Google Calendar] ⚠️ Google 계정은 연동되어 있으나 accessToken이 저장되어 있지 않습니다.`);
        }

        // 3단계: 실제 구글 API에서 가져온 일정이 있으면 변환
        if (googleItems.length > 0) {
          console.log(`[Google Calendar] 실제 Google Calendar 일정 ${googleItems.length}개를 반환 목록에 추가합니다.`);
          for (const item of googleItems) {
            const start = item.start?.dateTime || item.start?.date || new Date().toISOString();
            const end = item.end?.dateTime || item.end?.date || start;
            events.push({
              id: `google-${item.id}`,
              title: item.summary || '(Google 캘린더 일정)',
              description: item.description || null,
              startDate: start,
              endDate: end,
              status: item.status || 'CONFIRMED',
              type: 'google',
              source: 'google',
              htmlLink: item.htmlLink || null,
              location: item.location || null,
            });
          }
        } else {
          console.log(`[Google Calendar] ℹ️ "${targetCalTitle}" 캘린더에 조회된 실제 일정이 없거나 토큰 갱신이 필요하여 임의의 가짜 일정은 반환하지 않습니다.`);
        }
      }
    } catch (googleError) {
      console.error('[GOOGLE_CALENDAR_SERVICE_ERROR]', googleError);
    }
  }

  // 6. 외부 CalDAV 캘린더 연동 계정이 있는 경우 CalDAV 일정 조회 및 병합
  if (userId) {
    try {
      const { getCalDavEventsService } = await import('./getCalDavEvents.service.js');
      const caldavEvents = await getCalDavEventsService(userId, { startDate, endDate });
      if (caldavEvents.length > 0) {
        console.log(`[CalDAV] 외부 CalDAV 일정 ${caldavEvents.length}건을 캘린더에 병합합니다.`);
        events.push(...caldavEvents);
      }
    } catch (caldavErr) {
      console.error('[CALDAV_SERVICE_ERROR]', caldavErr);
    }
  }

  return events;
};
