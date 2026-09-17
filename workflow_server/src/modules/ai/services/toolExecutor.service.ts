import { prisma } from '#lib/prisma.js';
import { getIssuesService } from '../../issues/services/getIssues.service.js';
import { getIssueService } from '../../issues/services/getIssue.service.js';

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  summary: string;
  error?: string;
}

export class ToolExecutor {
  /**
   * 실시간 자율 실행(Server-side Auto Execution) 대상 읽기/조회 도구 여부 판별
   */
  public static isReadTool(name: string): boolean {
    return [
      'search_projects',
      'search_issues',
      'get_issue_detail',
      'search_sprints',
    ].includes(name);
  }

  /**
   * 서버 측 도구 직접 실행
   */
  public static async execute(
    name: string,
    args: Record<string, any>,
    currentUserId?: number
  ): Promise<ToolExecutionResult> {
    try {
      switch (name) {
        case 'search_projects':
          return await this.searchProjects(args);
        case 'search_issues':
          return await this.searchIssues(args, currentUserId);
        case 'get_issue_detail':
          return await this.getIssueDetail(args, currentUserId);
        case 'search_sprints':
          return await this.searchSprints(args);
        default:
          return {
            success: false,
            summary: `지원되지 않는 도구: ${name}`,
            error: `Tool ${name} not supported by Server Executor`,
          };
      }
    } catch (err: any) {
      console.error(`[ToolExecutor] Error executing ${name}:`, err);
      return {
        success: false,
        summary: `도구 ${name} 실행 중 오류 발생: ${err.message}`,
        error: err.message,
      };
    }
  }

  /**
   * 프로젝트 검색 및 목록 조회
   */
  private static async searchProjects(args: { search?: string }): Promise<ToolExecutionResult> {
    const search = args.search?.trim();
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { key: { contains: search } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
        status: true,
        _count: { select: { issues: true } },
      },
      take: 10,
    });

    const items = projects.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      description: p.description,
      status: p.status,
      issuesCount: p._count.issues,
    }));

    return {
      success: true,
      data: items,
      summary: items.length === 0
        ? `프로젝트 검색 결과 없음 (${search || '전체'})`
        : `프로젝트 ${items.length}개 발견: ${items.map((p) => `"${p.name}"(ID: ${p.id})`).join(', ')}`,
    };
  }

  /**
   * 이슈 검색 및 목록 조회 (다양한 조건 필터링)
   */
  private static async searchIssues(
    args: {
      projectId?: number;
      projectName?: string;
      status?: string;
      statusId?: number;
      isMy?: boolean;
      dueDateFilter?: string;
      search?: string;
    },
    currentUserId?: number
  ): Promise<ToolExecutionResult> {
    let targetProjectId = args.projectId;

    // 프로젝트 이름이 주어졌다면 먼저 프로젝트 ID 검색
    if (!targetProjectId && args.projectName) {
      const proj = await prisma.project.findFirst({
        where: { name: { contains: args.projectName.trim() } },
        select: { id: true, name: true },
      });
      if (proj) {
        targetProjectId = proj.id;
      }
    }

    // 상태 이름 -> statusId 변환
    let statusId = args.statusId;
    if (!statusId && args.status) {
      const statusMap: Record<string, number> = { 대기: 1, 진행: 2, 검토: 3, 완료: 4 };
      statusId = statusMap[args.status] || undefined;
    }

    const query: any = {
      projectId: targetProjectId,
      statusId: statusId,
      assigneeId: args.isMy ? 'my' : undefined,
      search: args.search,
      take: 15,
    };

    const res = await getIssuesService(query, currentUserId);
    let items = res.items || [];

    // 기한(dueDateFilter) 메모리 정밀 필터링 (today, overdue, upcoming)
    const todayStr = new Date().toISOString().substring(0, 10);
    if (args.dueDateFilter === 'today') {
      items = items.filter((i) => i.dueDate && String(i.dueDate).startsWith(todayStr));
    } else if (args.dueDateFilter === 'overdue') {
      items = items.filter((i) => i.dueDate && String(i.dueDate).substring(0, 10) < todayStr && i.statusId !== 4);
    } else if (args.dueDateFilter === 'upcoming') {
      items = items.filter((i) => i.dueDate && String(i.dueDate).substring(0, 10) >= todayStr);
    }

    // AI 모델 컨텍스트를 위해 핵심 필드만 압축 직렬화 (토큰 절감)
    const compactItems = items.slice(0, 10).map((i: any) => ({
      id: i.id,
      issueNumber: i.issueNumber,
      title: i.title,
      projectName: i.project?.name,
      status: i.status?.name || (['', '대기', '진행', '검토', '완료'][i.statusId] || '미정'),
      priority: i.priority?.name || (['', '낮음', '보통', '높음', '긴급'][i.priorityId] || '보통'),
      assignee: i.assignee?.name || '미지정',
      dueDate: i.dueDate ? String(i.dueDate).substring(0, 10) : null,
      parentId: i.parentId,
    }));

    return {
      success: true,
      data: compactItems,
      summary: compactItems.length === 0
        ? '조건에 맞는 이슈 없음'
        : `이슈 ${compactItems.length}건 조회됨: ${compactItems.map((i) => `#${i.id} "${i.title}"(${i.status}, 마감: ${i.dueDate || '없음'})`).join(', ')}`,
    };
  }

  /**
   * 특정 이슈의 상세 정보 조회
   */
  private static async getIssueDetail(
    args: { issueId: number },
    currentUserId?: number
  ): Promise<ToolExecutionResult> {
    const issueId = Number(args.issueId);
    if (!issueId) {
      return { success: false, summary: '이슈 ID가 지정되지 않음', error: 'Invalid issueId' };
    }

    try {
      const issue: any = await getIssueService(issueId, currentUserId);
      if (!issue) {
        return {
          success: true,
          data: { id: issueId },
          summary: `이슈 #${issueId}는 현재 DB에 존재하지 않습니다. 사용자가 지정한 번호 #${issueId}를 그대로 상위 이슈(parentId: ${issueId})로 사용하여 create_issue를 호출하세요.`,
        };
      }

      const detail = {
        id: issue.id,
        issueNumber: issue.issueNumber,
        title: issue.title,
        description: issue.description,
        projectName: issue.project?.name,
        status: issue.status?.name,
        priority: issue.priority?.name,
        assignee: issue.assignee ? { id: issue.assignee.id, name: issue.assignee.name } : null,
        author: issue.author ? { id: issue.author.id, name: issue.author.name } : null,
        dueDate: issue.dueDate ? String(issue.dueDate).substring(0, 10) : null,
        plannedStartDate: issue.plannedStartDate ? String(issue.plannedStartDate).substring(0, 10) : null,
        parent: issue.parent ? { id: issue.parent.id, title: issue.parent.title } : null,
        children: (issue.children || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          status: c.status?.name,
        })),
        commentsCount: issue._count?.comments ?? 0,
      };

      return {
        success: true,
        data: detail,
        summary: `이슈 #${issue.id} ('${issue.title}') 상세 정보 로드 완료 (상태: ${issue.status?.name}, 담당: ${detail.assignee?.name || '미지정'})`,
      };
    } catch {
      return {
        success: true,
        data: { id: issueId },
        summary: `이슈 #${issueId}를 조회할 수 없습니다. 사용자가 지정한 번호 #${issueId}를 그대로 상위 이슈(parentId: ${issueId})로 사용하세요.`,
      };
    }
  }

  /**
   * 스프린트 목록 조회
   */
  private static async searchSprints(args: {
    projectId?: number;
    projectName?: string;
    status?: string;
  }): Promise<ToolExecutionResult> {
    let targetProjectId = args.projectId;

    if (!targetProjectId && args.projectName) {
      const proj = await prisma.project.findFirst({
        where: { name: { contains: args.projectName.trim() } },
        select: { id: true },
      });
      if (proj) targetProjectId = proj.id;
    }

    const where: any = {};
    if (targetProjectId) where.projectId = targetProjectId;
    if (args.status) where.status = args.status;

    const sprints = await prisma.sprint.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        goal: true,
        project: { select: { name: true } },
        _count: { select: { issues: true } },
      },
      take: 10,
    });

    const items = sprints.map((s) => ({
      id: s.id,
      name: s.name,
      projectName: s.project?.name,
      status: s.status,
      startDate: s.startDate ? String(s.startDate).substring(0, 10) : null,
      endDate: s.endDate ? String(s.endDate).substring(0, 10) : null,
      goal: s.goal,
      issuesCount: s._count.issues,
    }));

    return {
      success: true,
      data: items,
      summary: items.length === 0
        ? '스프린트 목록 없음'
        : `스프린트 ${items.length}개 발견: ${items.map((s) => `"${s.name}"(상태: ${s.status})`).join(', ')}`,
    };
  }
}
