// -*- coding: utf-8 -*-
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { syncIssueTagsService } from '../modules/tags/services/syncIssueTags.service.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';
import { createProjectService } from '../modules/projects/services/createProject.service.js';

describe('Tags Service - syncIssueTags Unit Tests', () => {
  let testProjectId: number;
  let testIssueId: number;
  let testUserId: number;

  beforeEach(async () => {
    // 1. 테스트 유저 생성 또는 조회
    const user = await prisma.user.upsert({
      where: { email: 'tag_tester@example.com' },
      update: {},
      create: {
        email: 'tag_tester@example.com',
        name: '태그 테스터',
      },
    });
    testUserId = user.id;

    // 2. 테스트 프로젝트 생성
    const project = await createProjectService(
      {
        name: '태그 테스트 프로젝트',
        key: `TAGPRJ${Date.now() % 10000}`,
      },
      testUserId
    );
    testProjectId = project.id;

    // 3. 테스트 이슈 생성
    const issue = await createIssueService(
      {
        title: '태그 테스트용 이슈',
        projectId: testProjectId,
      },
      testUserId
    );
    testIssueId = issue.id;
  });

  it('이슈에 해시태그를 성공적으로 동기화하고 Tag DB에 저장한다', async () => {
    const tags = await syncIssueTagsService(testIssueId, '#태그 #태그1 #신규기능');
    expect(tags.length).toBe(3);
    expect(tags.map((t: any) => t.name)).toContain('태그');
    expect(tags.map((t: any) => t.name)).toContain('태그1');
    expect(tags.map((t: any) => t.name)).toContain('신규기능');

    // DB에서 이슈 조회 시 태그가 연결되어 있는지 확인
    const issueWithTags = await prisma.issue.findUnique({
      where: { id: testIssueId },
      include: { tags: true },
    });
    expect(issueWithTags?.tags.length).toBe(3);
  });

  it('태그를 변경하면 기존 태그는 연결 해제되고 새 태그로 갱신된다', async () => {
    await syncIssueTagsService(testIssueId, '#태그 #태그1');
    const updatedTags = await syncIssueTagsService(testIssueId, '#버그수정 #긴급');

    expect(updatedTags.length).toBe(2);
    expect(updatedTags.map((t: any) => t.name)).toContain('버그수정');
    expect(updatedTags.map((t: any) => t.name)).not.toContain('태그1');
  });
});
