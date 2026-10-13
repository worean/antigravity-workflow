import type { Issue, Project, User } from '@/types';

/**
 * 주어진 사용자가 해당 프로젝트에 속해 있는지(소유자, 멤버, 또는 소속 그룹 멤버인지) 판별
 */
export const isUserProjectMember = (
  project: Project | undefined | null,
  user: User | null | undefined
): boolean => {
  if (!user || !project) return false;
  if (user.role === 'ADMIN') return true;

  // 1. 프로젝트 소유자 (PM/Owner)
  if (project.ownerId === user.id) return true;

  // 2. 프로젝트 개인 멤버
  if (Array.isArray(project.members) && project.members.some((m) => m.userId === user.id)) {
    return true;
  }

  // 3. 프로젝트 참여 그룹의 멤버
  if (
    Array.isArray(project.groups) &&
    project.groups.some(
      (g) => Array.isArray(g.group?.members) && g.group.members.some((gm) => gm.userId === user.id)
    )
  ) {
    return true;
  }

  return false;
};

/**
 * ⭐️ 대시보드 위젯 공통 필터링:
 * 이슈가 "현재 자신이 속한 프로젝트이거나, 자신이 담당 또는 보고한 일감"인지 검증
 */
export const isIssueInvolvedWithUser = (
  issue: Issue,
  user: User | null | undefined,
  myProjectIds?: Set<number>
): boolean => {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;

  // 1. 자신이 담당자(Assignee)인 일감
  if (issue.assigneeId === user.id) return true;

  // 2. 자신이 보고자/작성자(Author / Reporter)인 일감
  if (issue.authorId === user.id || (issue as any).reporterId === user.id) return true;

  // 3. 자신이 속한 프로젝트의 일감
  if (myProjectIds && issue.projectId && myProjectIds.has(issue.projectId)) {
    return true;
  }
  if (issue.project && isUserProjectMember(issue.project as any, user)) {
    return true;
  }

  return false;
};

/**
 * 주어진 이슈 목록을 사용자가 속한 프로젝트 또는 담당/보고한 일감만으로 필터링
 */
export const filterUserInvolvedIssues = (
  issues: Issue[],
  user: User | null | undefined,
  myProjectIds?: Set<number>
): Issue[] => {
  if (!user) return [];
  if (user.role === 'ADMIN') return issues;
  return issues.filter((iss) => isIssueInvolvedWithUser(iss, user, myProjectIds));
};
