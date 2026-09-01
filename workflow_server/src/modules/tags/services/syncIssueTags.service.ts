// -*- coding: utf-8 -*-
import { prisma, type PrismaTx } from '#lib/prisma.js';
import { extractTags, getTagColor } from './extractTags.js';

/**
 * 🏷️ 이슈의 태그 목록을 DB와 동기화 (Upsert & Connect/Disconnect)
 */
export const syncIssueTagsService = async (
  issueId: number,
  tagInput: string | string[] | undefined | null,
  tx?: PrismaTx
) => {
  const db = tx ?? prisma;
  if (!issueId) return [];

  const tagNames = extractTags(tagInput);

  if (tagNames.length === 0) {
    // 모든 태그 연결 해제
    await db.issue.update({
      where: { id: issueId },
      data: { tags: { set: [] } },
    });
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

  return await db.tag.findMany({
    where: { id: { in: tagIds } },
  });
};
