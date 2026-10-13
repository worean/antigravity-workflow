import { prisma, type PrismaTx } from '#lib/prisma.js';
import { extractTags, getTagColor } from './extractTags.js';
import { cleanupUnusedTagsService } from './cleanupUnusedTags.service.js';

/**
 * 🏷️ 이슈의 태그 목록을 DB와 동기화 (Upsert & Connect/Disconnect & 자동 정리)
 */
export const syncIssueTagsService = async (
  issueId: number,
  tagInput: string | string[] | undefined | null,
  tx?: PrismaTx
) => {
  const db = tx ?? prisma;
  if (!issueId) return [];

  // 기존에 연결되어 있던 태그 목록 조회
  const existingIssue = await db.issue.findUnique({
    where: { id: issueId },
    select: { tags: { select: { id: true } } },
  });
  const previousTagIds = existingIssue?.tags.map((t) => t.id) || [];

  const tagNames = extractTags(tagInput);

  if (tagNames.length === 0) {
    // 모든 태그 연결 해제
    await db.issue.update({
      where: { id: issueId },
      data: { tags: { set: [] } },
    });

    // 기존 태그 중 참조 수가 0이 된 태그 자동 삭제
    if (previousTagIds.length > 0) {
      await cleanupUnusedTagsService(previousTagIds, tx);
    }

    return [];
  }

  // 1. 각 태그가 존재하는지 확인하고 없으면 자동 생성 (Upsert)
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

  // 2. 이슈와 태그 연결 (set으로 기존 연결 덮어쓰기)
  await db.issue.update({
    where: { id: issueId },
    data: {
      tags: {
        set: tagIds.map((id) => ({ id })),
      },
    },
  });

  // 3. 기존 태그 중 이번에 제외된 태그들 중 참조 수가 0이 된 태그 자동 삭제
  const removedTagIds = previousTagIds.filter((id) => !tagIds.includes(id));
  if (removedTagIds.length > 0) {
    await cleanupUnusedTagsService(removedTagIds, tx);
  }

  return await db.tag.findMany({
    where: { id: { in: tagIds } },
  });
};
