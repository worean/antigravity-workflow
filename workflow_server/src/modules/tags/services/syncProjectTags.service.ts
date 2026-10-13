import { prisma, type PrismaTx } from '#lib/prisma.js';
import { extractTags, getTagColor } from './extractTags.js';
import { cleanupUnusedTagsService } from './cleanupUnusedTags.service.js';

/**
 * 🏷️ 프로젝트의 태그 목록을 DB와 동기화 (Upsert & Connect/Disconnect & 자동 정리)
 */
export const syncProjectTagsService = async (
  projectId: number,
  tagInput: string | string[] | undefined | null,
  tx?: PrismaTx
) => {
  const db = tx ?? prisma;
  if (!projectId) return [];

  // 기존에 연결되어 있던 태그 목록 조회
  const existingProject = await db.project.findUnique({
    where: { id: projectId },
    select: { tags: { select: { id: true } } },
  });
  const previousTagIds = existingProject?.tags.map((t) => t.id) || [];

  const tagNames = extractTags(tagInput);

  if (tagNames.length === 0) {
    await db.project.update({
      where: { id: projectId },
      data: { tags: { set: [] } },
    });

    if (previousTagIds.length > 0) {
      await cleanupUnusedTagsService(previousTagIds, tx);
    }

    return [];
  }

  const tagIds: number[] = [];
  for (const name of tagNames) {
    const tag = await db.tag.upsert({
      where: { name },
      update: {},
      create: {
        name,
        color: getTagColor(name),
      },
    });
    tagIds.push(tag.id);
  }

  await db.project.update({
    where: { id: projectId },
    data: {
      tags: {
        set: tagIds.map((id) => ({ id })),
      },
    },
  });

  // 기존 태그 중 이번에 제외된 태그들 중 참조 수가 0이 된 태그 자동 삭제
  const removedTagIds = previousTagIds.filter((id) => !tagIds.includes(id));
  if (removedTagIds.length > 0) {
    await cleanupUnusedTagsService(removedTagIds, tx);
  }

  return await db.tag.findMany({
    where: { id: { in: tagIds } },
  });
};
