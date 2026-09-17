import { prisma } from '#lib/prisma.js';

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
  type: 'issue' | 'sprint';
  project?: {
    id: number;
    name: string;
    color?: string | null;
  };
  assignee?: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
}

export interface GetCalendarEventsFilter {
  projectId?: number;
  startDate?: string;
  endDate?: string;
}

export const getCalendarEventsService = async (
  filter: GetCalendarEventsFilter = {}
): Promise<CalendarEventDto[]> => {
  const { projectId, startDate, endDate } = filter;

  // 1. 이슈 조회 필터 구성
  const issueWhere: any = {};
  if (projectId) {
    issueWhere.projectId = Number(projectId);
  }

  // 날짜 범위 필터링이 주어진 경우
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    issueWhere.OR = [
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
    ];
  }

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
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  // 2. 스프린트 조회 필터 구성 (마일스톤/스프린트 일정)
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

  const events: CalendarEventDto[] = [];

  // 이슈 이벤트 변환
  for (const issue of issues) {
    // 시작일과 마감일 결정
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
      project: issue.project ? {
        id: issue.project.id,
        name: issue.project.name,
        key: issue.project.key,
      } : undefined,
      assignee: issue.assignee ? {
        id: issue.assignee.id,
        name: issue.assignee.name,
        avatar: issue.assignee.avatar,
      } : null,
    });
  }

  // 스프린트 일정 변환
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
        project: sprint.project ? {
          id: sprint.project.id,
          name: sprint.project.name,
          key: sprint.project.key,
        } : undefined,
      });
    }
  }

  return events;
};
