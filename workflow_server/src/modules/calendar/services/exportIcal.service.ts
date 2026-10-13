import { prisma } from '#lib/prisma.js';
import { generateIcsCalendar, type IcalEventInput } from '../../../lib/icalHelper.js';

export interface ExportIcalParams {
  projectId?: number;
  userId?: number;
  onlyMyEvents?: boolean;
}

export interface ExportIcalResult {
  icsContent: string;
  filename: string;
  calendarName: string;
}

export const exportIcalService = async (params: ExportIcalParams): Promise<ExportIcalResult> => {
  const { projectId, userId, onlyMyEvents } = params;

  let calendarName = 'AntiGravity 워크스페이스 캘린더';
  let projectKey = 'WORKFLOW';

  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      select: { id: true, name: true, key: true },
    });
    if (project) {
      calendarName = `[${project.key}] ${project.name} 일정`;
      projectKey = project.key;
    }
  }

  // 1. 이슈(일감 / WBS 작업) 조회
  const issueWhere: any = {
    OR: [
      { dueDate: { not: null } },
      { plannedStartDate: { not: null } },
    ],
  };

  if (projectId) {
    issueWhere.projectId = Number(projectId);
  }

  if (onlyMyEvents && userId) {
    issueWhere.assigneeId = Number(userId);
  }

  const issues = await prisma.issue.findMany({
    where: issueWhere,
    include: {
      type: true,
      priority: true,
      status: true,
      project: { select: { id: true, name: true, key: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const icalEvents: IcalEventInput[] = [];

  for (const issue of issues) {
    const start = issue.plannedStartDate || issue.dueDate || new Date();
    const end = issue.dueDate || issue.plannedStartDate || start;
    const isAllDay = !issue.plannedStartDate || !issue.dueDate || (
      start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0
    );

    const pKey = issue.project?.key || projectKey;
    const summary = `[${pKey}-${issue.id}] ${issue.title} (${issue.status?.name || '진행'})`;

    let desc = `상태: ${issue.status?.name || '-'}\n유형: ${issue.type?.name || '-'}\n우선순위: ${issue.priority?.name || '-'}`;
    if (issue.assignee) {
      desc += `\n담당자: ${issue.assignee.name || issue.assignee.email}`;
    }
    if (issue.description) {
      desc += `\n\n${issue.description.slice(0, 500)}`;
    }

    icalEvents.push({
      uid: `issue-${issue.id}@antigravity-workflow`,
      summary,
      description: desc,
      startDate: start,
      endDate: end,
      isAllDay,
      status: issue.status?.name === 'DONE' ? 'CONFIRMED' : 'CONFIRMED',
      priority: issue.priority?.name === 'URGENT' ? 1 : issue.priority?.name === 'HIGH' ? 3 : 5,
      categories: [issue.type?.name || 'Task'],
      progressPercent: issue.progress,
      url: `/issues/${issue.id}`,
      organizer: issue.assignee ? { name: issue.assignee.name || undefined, email: issue.assignee.email } : null,
    });
  }

  // 2. 마일스톤 일정 조회 (프로젝트별)
  const milestoneWhere: any = {
    OR: [
      { dueDate: { not: null } },
      { plannedStartDate: { not: null } },
    ],
  };
  if (projectId) milestoneWhere.projectId = Number(projectId);

  const milestones = await prisma.milestone.findMany({
    where: milestoneWhere,
    include: { project: { select: { key: true, name: true } } },
  });

  for (const ms of milestones) {
    const start = ms.plannedStartDate || ms.dueDate || new Date();
    const end = ms.dueDate || ms.plannedStartDate || start;
    icalEvents.push({
      uid: `milestone-${ms.id}@antigravity-workflow`,
      summary: `🚩 [마일스톤] ${ms.title}`,
      description: ms.description || '마일스톤 주요 마감 일정',
      startDate: start,
      endDate: end,
      isAllDay: true,
      categories: ['Milestone'],
    });
  }

  // 3. 스프린트 일정 조회 (내 일정만 보기가 아닐 때)
  if (!onlyMyEvents) {
    const sprintWhere: any = {
      startDate: { not: null },
      endDate: { not: null },
    };
    if (projectId) sprintWhere.projectId = Number(projectId);

    const sprints = await prisma.sprint.findMany({
      where: sprintWhere,
      include: { project: { select: { key: true, name: true } } },
    });

    for (const sp of sprints) {
      if (sp.startDate && sp.endDate) {
        icalEvents.push({
          uid: `sprint-${sp.id}@antigravity-workflow`,
          summary: `⚡ [스프린트] ${sp.name}`,
          description: `스프린트 기간: ${sp.startDate.toLocaleDateString()} ~ ${sp.endDate.toLocaleDateString()}`,
          startDate: sp.startDate,
          endDate: sp.endDate,
          isAllDay: true,
          categories: ['Sprint'],
        });
      }
    }
  }

  const safeFilename = `${projectKey.toLowerCase()}-calendar-${Date.now()}.ics`;
  const icsContent = generateIcsCalendar({
    calendarName,
    description: `${calendarName} - AntiGravity Workflow 실시간 캘린더 피드`,
    events: icalEvents,
  });

  return {
    icsContent,
    filename: safeFilename,
    calendarName,
  };
};
