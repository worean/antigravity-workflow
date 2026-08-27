import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { createActivityLogService } from '../modules/activityLogs/services/createActivityLog.service.js';
import { getActivityLogsService } from '../modules/activityLogs/services/getActivityLogs.service.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';
import { deleteProjectService } from '../modules/projects/services/deleteProject.service.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';
import { updateIssueService } from '../modules/issues/services/updateIssue.service.js';
import { deleteIssueService } from '../modules/issues/services/deleteIssue.service.js';
import { addMemberService } from '../modules/projects/services/addMember.service.js';

describe('ActivityLog Service & Non-Relational Persistence Tests', () => {
  let testUser: any;
  let memberUser: any;

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: `audit_user_${Date.now()}@example.com`,
        name: 'Audit Manager'
      }
    });

    memberUser = await prisma.user.create({
      data: {
        email: `member_user_${Date.now()}@example.com`,
        name: 'Assigned Member'
      }
    });
  });

  it('1. should create activity log directly without relational constraints', async () => {
    const log = await createActivityLogService({
      action: 'CUSTOM_EVENT',
      entityType: 'EXTERNAL_RESOURCE',
      entityId: 99999, // 존재하지 않는 가상의 ID여도 외래키 에러 없이 저장되어야 함
      userId: testUser.id,
      summary: '직접 작업 로그 생성 테스트',
      details: { customKey: 'customValue' }
    });

    expect(log.id).toBeDefined();
    expect(log.action).toBe('CUSTOM_EVENT');
    expect(log.entityType).toBe('EXTERNAL_RESOURCE');
    expect(log.entityId).toBe(99999);
    expect(log.userId).toBe(testUser.id);
    expect(log.userName).toBe(testUser.name);
    expect(log.userEmail).toBe(testUser.email);
    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('2. should automatically record activity logs on Project CUD and Member Assignment', async () => {
    // 2-1. 프로젝트 생성
    const project = await createProjectService({
      name: 'Audit Target Project',
      key: `AUDPRJ_${Date.now()}`
    }, testUser.id);

    // 2-2. 인원 할당
    await addMemberService(project.id, memberUser.id, 'DEVELOPER', testUser.id);

    // 2-3. 프로젝트 삭제
    await deleteProjectService(project.id, testUser.id);

    // 2-4. 로그 조회 및 비관계형 영속성 검증 (프로젝트가 삭제되어도 로그는 완전히 보존되어야 함)
    const logsRes = await getActivityLogsService({
      userId: testUser.id
    });

    const createProjLog = logsRes.logs.find(l => l.action === 'CREATE' && l.entityType === 'PROJECT');
    const assignLog = logsRes.logs.find(l => l.action === 'ASSIGN_MEMBER');
    const deleteProjLog = logsRes.logs.find(l => l.action === 'DELETE' && l.entityType === 'PROJECT');

    expect(createProjLog).toBeDefined();
    expect(createProjLog?.summary).toContain('Audit Target Project');
    expect(assignLog).toBeDefined();
    expect(assignLog?.summary).toContain('DEVELOPER');
    expect(deleteProjLog).toBeDefined();
    expect(deleteProjLog?.summary).toContain('삭제');
  });

  it('3. should automatically record activity logs on Issue CUD lifecycle', async () => {
    const project = await createProjectService({
      name: 'Issue Audit Project',
      key: `ISSAUD_${Date.now()}`
    }, testUser.id);

    // 3-1. 이슈 생성
    const issue = await createIssueService({
      title: 'Audit Issue Task',
      projectId: project.id
    }, testUser.id);

    // 3-2. 이슈 수정
    await updateIssueService(issue.id, {
      title: 'Audit Issue Task (Updated)',
      userId: testUser.id,
      progress: 50
    });

    // 3-3. 이슈 삭제
    await deleteIssueService(issue.id, testUser.id);

    // 3-4. 로그 조회 및 검증 (이슈가 삭제된 후에도 로그 레코드 보존)
    const logsRes = await getActivityLogsService({
      entityId: issue.id,
      entityType: 'ISSUE'
    });

    expect(logsRes.logs.length).toBeGreaterThanOrEqual(3);
    const actions = logsRes.logs.map(l => l.action);
    expect(actions).toContain('CREATE');
    expect(actions).toContain('UPDATE');
    expect(actions).toContain('DELETE');
  });
});
