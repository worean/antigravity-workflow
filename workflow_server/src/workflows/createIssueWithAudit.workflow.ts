// -*- coding: utf-8 -*-
import { runTransaction } from '#lib/prisma.js';
import { createIssueService } from '#modules/issues/services/createIssue.service.js';
import { createActivityLogService } from '#modules/activityLogs/services/createActivityLog.service.js';

export interface CreateIssueWorkflowInput {
  title: string;
  projectId: number;
  authorId: number;
  description?: string;
  assigneeId?: number;
  typeId?: number;
  priorityId?: number;
  statusId?: number;
  sprintId?: number;
  parentId?: number;
  estimatedHours?: number;
  customFields?: Record<string, any>;
  plannedStartDate?: string;
  dueDate?: string;
}

/**
 * ⭐️ 다중 도메인 복합 오케스트레이션 워크플로우
 * Issue 도메인 생성과 ActivityLog 도메인 감사 기록, 상위 일정 롤업을 단일 트랜잭션으로 원자적(Atomic) 실행합니다.
 */
export const createIssueWithAuditWorkflow = async (
  input: CreateIssueWorkflowInput,
  authorId: number
) => {
  return await runTransaction(async (tx) => {
    // 1. Issue 도메인: 이슈 생성 (내부에서 syncParentDatesService도 tx로 연계)
    const newIssue = await createIssueService(input, authorId, tx);

    // 2. ActivityLog 도메인: 명시적 감사 로그 적재
    await createActivityLogService(
      {
        action: 'WORKFLOW_CREATE_ISSUE',
        entityType: 'ISSUE',
        entityId: newIssue.id,
        userId: authorId,
        summary: `[Workflow] 이슈 #${newIssue.id} ('${newIssue.title}') 원자적 생성 완료`,
        details: { title: newIssue.title, projectId: newIssue.projectId }
      },
      tx
    );

    return newIssue;
  });
};
