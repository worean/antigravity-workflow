import { prisma, type PrismaTx } from '#lib/prisma.js';
import { extractTags, getTagColor } from './extractTags.js';

/**
 * 🏷️ 프로젝트의 태그 목록을 DB와 동기화 (Upsert & Connect/Disconnect)
 */
export const syncProjectTagsService = async (
  projectId: number,
  tagInput: string | string[] | undefined | null,
  tx?: PrismaTx
) => {
  const db = tx ?? prisma;
  if (!projectId) return [];

  const tagNames = extractTags(tagInput);

  if (tagNames.length === 0) {
    await db.project.update({
      where: { id: projectId },
      data: { tags: { set: [] } },
    });
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

  return await db.tag.findMany({
    where: { id: { in: tagIds } },
  });
};
