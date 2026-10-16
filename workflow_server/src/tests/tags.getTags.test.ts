import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { getTagsService } from '../modules/tags/services/getTags.service.js';
import { createTagService } from '../modules/tags/services/createTag.service.js';

describe('Tags Service - getTags Unit Tests', () => {
  let testProject: any;

  beforeAll(async () => {
    const rand = Math.random().toString(36).substring(2, 7) + Date.now();
    const user = await prisma.user.create({
      data: {
        email: `gettags_${rand}@test.com`,
        name: 'GetTags Tester',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: `GetTags Project ${rand}`,
        key: `GT_${Date.now().toString().slice(-6)}`,
        ownerId: user.id,
      },
    });
  });

  it('전체 태그 목록을 성공적으로 조회한다', async () => {
    const uniqueTag = `테스트조회태그_${Date.now()}`;
    const tag = await createTagService({ name: uniqueTag });
    await prisma.project.update({
      where: { id: testProject.id },
      data: { tags: { connect: { id: tag.id } } },
    });

    const tags = await getTagsService({ limit: 1000 });
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThanOrEqual(1);
    expect(tags.some((t: any) => t.name === uniqueTag)).toBe(true);
  });

  it('태그 이름 검색 쿼리를 통해 특정 태그만 필터링하여 조회한다', async () => {
    const searchTarget = `검색타겟_${Date.now()}`;
    const tag = await createTagService({ name: searchTarget });
    await prisma.project.update({
      where: { id: testProject.id },
      data: { tags: { connect: { id: tag.id } } },
    });

    const tags = await getTagsService({ search: `#${searchTarget}` });
    expect(tags.length).toBe(1);
    expect(tags[0].name).toBe(searchTarget);
  });
});
