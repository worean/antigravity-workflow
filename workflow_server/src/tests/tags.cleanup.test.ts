import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { syncIssueTagsService } from '../modules/tags/services/syncIssueTags.service.js';
import { getTagsService } from '../modules/tags/services/getTags.service.js';
import { deleteIssueService } from '../modules/issues/services/deleteIssue.service.js';
import { createIssueService } from '../modules/issues/services/createIssue.service.js';

describe('🏷️ [Tags: Automatic Cleanup of 0-Item Tags] Unit Tests', () => {
  let testUser: any;
  let project: any;
  let issue1: any;
  let issue2: any;

  beforeEach(async () => {
    const rand = Math.random().toString(36).substring(2, 8) + Date.now();

    // 테스트 유저 생성
    testUser = await prisma.user.create({
      data: {
        email: `taguser_${rand}@test.com`,
        name: `TagUser_${rand}`,
        password: 'password123',
      },
    });

    // 테스트 프로젝트 생성
    project = await prisma.project.create({
      data: {
        name: `태그테스트프로젝트_${rand}`,
        key: `TAG_${rand.substring(0, 4).toUpperCase()}`,
        ownerId: testUser.id,
      },
    });

    // 테스트 이슈 2개 생성
    issue1 = await createIssueService(
      {
        title: '첫 번째 테스트 이슈',
        projectId: project.id,
      },
      testUser.id
    );

    issue2 = await createIssueService(
      {
        title: '두 번째 테스트 이슈',
        projectId: project.id,
      },
      testUser.id
    );
  });

  it('1. 이슈에 태그를 등록하면 Tag 테이블에 태그가 생성되어야 한다', async () => {
    const tagName = `신규태그_${Date.now()}`;
    const synced = await syncIssueTagsService(issue1.id, [`#${tagName}`]);

    expect(synced.length).toBe(1);
    expect(synced[0].name).toBe(tagName);

    const dbTag = await prisma.tag.findUnique({ where: { name: tagName } });
    expect(dbTag).not.toBeNull();
  });

  it('2. 이슈에서 태그를 모두 제거하면(0개 항목), 해당 태그는 DB에서 자동 삭제되어야 한다', async () => {
    const tagName = `임시삭제태그_${Date.now()}`;
    await syncIssueTagsService(issue1.id, [`#${tagName}`]);

    // DB에 태그 존재 확인
    let dbTag = await prisma.tag.findUnique({ where: { name: tagName } });
    expect(dbTag).not.toBeNull();

    // 이슈에서 태그 제거 (빈 배열 전달)
    await syncIssueTagsService(issue1.id, []);

    // DB에서 자동 삭제되었는지 검증
    dbTag = await prisma.tag.findUnique({ where: { name: tagName } });
    expect(dbTag).toBeNull();
  });

  it('3. 복수 이슈가 공유하는 태그는 한 이슈에서 제거되어도 다른 이슈가 남아있으면 유지되어야 한다', async () => {
    const sharedTagName = `공유태그_${Date.now()}`;
    await syncIssueTagsService(issue1.id, [`#${sharedTagName}`]);
    await syncIssueTagsService(issue2.id, [`#${sharedTagName}`]);

    // issue1에서만 태그 제거
    await syncIssueTagsService(issue1.id, []);

    // issue2에 남아있으므로 DB에 계속 존재해야 함
    let dbTag = await prisma.tag.findUnique({ where: { name: sharedTagName } });
    expect(dbTag).not.toBeNull();

    // issue2에서도 제거하면 최종적으로 DB에서 자동 삭제되어야 함
    await syncIssueTagsService(issue2.id, []);
    dbTag = await prisma.tag.findUnique({ where: { name: sharedTagName } });
    expect(dbTag).toBeNull();
  });

  it('4. 이슈 자체를 삭제(deleteIssue)하면, 연결되어 있던 전용 태그도 함께 자동 삭제되어야 한다', async () => {
    const orphanTagName = `이슈삭제태그_${Date.now()}`;
    await syncIssueTagsService(issue1.id, [`#${orphanTagName}`]);

    let dbTag = await prisma.tag.findUnique({ where: { name: orphanTagName } });
    expect(dbTag).not.toBeNull();

    // issue1 완전 삭제
    await deleteIssueService(issue1.id);

    // 해당 태그가 자동으로 함께 삭제되었는지 검증
    dbTag = await prisma.tag.findUnique({ where: { name: orphanTagName } });
    expect(dbTag).toBeNull();
  });

  it('5. getTagsService 조회 시 0개 항목인 태그는 목록에 결코 노출되지 않아야 한다', async () => {
    const activeTagName = `활성태그_${Date.now()}`;
    await syncIssueTagsService(issue1.id, [`#${activeTagName}`]);

    // 인위적으로 이슈 연결이 없는 고아 태그 1개 생성
    const emptyTagName = `고아태그_${Date.now()}`;
    await prisma.tag.create({
      data: { name: emptyTagName },
    });

    // 태그 목록 조회 (검색 및 전체 조회)
    const activeSearchList = await getTagsService({ search: activeTagName });
    const emptySearchList = await getTagsService({ search: emptyTagName });

    // 활성 태그는 조회되고, 고아 태그는 조회되지 않아야 함
    expect(activeSearchList.some((t: any) => t.name === activeTagName)).toBe(true);
    expect(emptySearchList.length).toBe(0);

    // 고아 태그가 DB에서도 자동 삭제되었는지 확인
    const emptyTagInDb = await prisma.tag.findUnique({ where: { name: emptyTagName } });
    expect(emptyTagInDb).toBeNull();
  });

  it('6. 이슈를 삭제하더라도 다른 이슈에서 해당 태그를 여전히 사용 중이라면 태그는 절대 삭제되지 않고 유지되어야 한다', async () => {
    const multiIssueTagName = `다중이슈태그_${Date.now()}`;
    await syncIssueTagsService(issue1.id, [`#${multiIssueTagName}`]);
    await syncIssueTagsService(issue2.id, [`#${multiIssueTagName}`]);

    let dbTag = await prisma.tag.findUnique({ where: { name: multiIssueTagName } });
    expect(dbTag).not.toBeNull();

    // issue1만 삭제 (issue2는 여전히 해당 태그를 참조 중)
    await deleteIssueService(issue1.id);

    // 태그가 삭제되지 않고 DB에 안전하게 유지되는지 검증
    dbTag = await prisma.tag.findUnique({ where: { name: multiIssueTagName } });
    expect(dbTag).not.toBeNull();
    expect(dbTag?.name).toBe(multiIssueTagName);

    // 마지막 남은 issue2마저 삭제하면 비로소 참조 수가 0개가 되어 자동 삭제되는지 검증
    await deleteIssueService(issue2.id);
    dbTag = await prisma.tag.findUnique({ where: { name: multiIssueTagName } });
    expect(dbTag).toBeNull();
  });
});

