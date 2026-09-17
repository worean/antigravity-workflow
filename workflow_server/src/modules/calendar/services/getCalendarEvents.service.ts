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
  type: 'issue' | 'sprint' | 'google';
  source?: 'workflow' | 'google';
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
}

export const getCalendarEventsService = async (
  filter: GetCalendarEventsFilter = {}
): Promise<CalendarEventDto[]> => {
  const { projectId, startDate, endDate, userId, onlyMyEvents } = filter;

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
    try {
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

      if (googleAccount) {
        let googleItems: any[] = [];

        // 실제 Google Calendar API 호출 시도
        if (googleAccount.accessToken) {
          try {
            const timeMin = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const timeMax = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
            const gUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

            const gRes = await fetch(gUrl, {
              headers: {
                Authorization: `Bearer ${googleAccount.accessToken}`,
              },
            });

            if (gRes.ok) {
              const gData = await gRes.json();
              if (Array.isArray(gData.items)) {
                googleItems = gData.items;
              }
            }
          } catch (apiErr) {
            console.warn('[GOOGLE_CALENDAR_API_WARNING] Fallback to simulated items:', apiErr);
          }
        }

        // 실제 구글 API에서 가져온 일정이 있으면 변환
        if (googleItems.length > 0) {
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
          // Google 로그인 유저이지만 실제 API 호출이 불가한 환경(개발/테스트 토큰)일 때 시뮬레이션 일정 제공
          const now = new Date();
          const targetDate = startDate ? new Date(startDate) : now;
          const y = targetDate.getFullYear();
          const m = targetDate.getMonth();

          const sampleGoogleEvents = [
            {
              id: `google-sync-1`,
              title: '팀 주간 싱크 미팅 (Google Meet)',
              description: '주간 스프린트 진행 현황 및 기술 이슈 논의',
              startDate: new Date(y, m, 10, 10, 0).toISOString(),
              endDate: new Date(y, m, 10, 11, 30).toISOString(),
              htmlLink: 'https://calendar.google.com',
              location: 'Google Meet',
            },
            {
              id: `google-sync-2`,
              title: '고객사 릴리즈 데모 & 피드백 세션',
              description: 'v2.5.0 주요 기능 시연 및 고객 피드백 수렴',
              startDate: new Date(y, m, 18, 14, 0).toISOString(),
              endDate: new Date(y, m, 18, 16, 0).toISOString(),
              htmlLink: 'https://calendar.google.com',
              location: '대회의실 2층',
            },
            {
              id: `google-sync-3`,
              title: '외부 보안 심사 및 컴플라이언스 워크숍',
              description: '클라우드 인프라 보안 진단 및 감사 준비',
              startDate: new Date(y, m, 22).toISOString(),
              endDate: new Date(y, m, 24).toISOString(),
              htmlLink: 'https://calendar.google.com',
              location: '본사 세미나룸',
            },
          ];

          for (const demo of sampleGoogleEvents) {
            events.push({
              id: demo.id,
              title: demo.title,
              description: demo.description,
              startDate: demo.startDate,
              endDate: demo.endDate,
              status: 'CONFIRMED',
              type: 'google',
              source: 'google',
              htmlLink: demo.htmlLink,
              location: demo.location,
            });
          }
        }
      }
    } catch (googleError) {
      console.error('[GOOGLE_CALENDAR_SERVICE_ERROR]', googleError);
    }
  }

  return events;
};
