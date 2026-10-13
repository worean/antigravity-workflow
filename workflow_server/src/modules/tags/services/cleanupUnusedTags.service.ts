import { prisma, type PrismaTx } from '#lib/prisma.js';

/**
 * 🧹 사용되지 않는 고아 태그(연결된 이슈 및 프로젝트가 0개인 태그) 자동 정리/삭제 서비스
 * @param tagIds 특정 태그 ID 목록 (선택 사항, 지정 시 해당 ID들 중 0개인 태그만 삭제)
 * @param tx Prisma 트랜잭션 클라이언트 (선택 사항)
 * @returns 삭제된 태그 개수
 */
export const cleanupUnusedTagsService = async (
  tagIds?: number[],
  tx?: PrismaTx
): Promise<number> => {
  const db = tx ?? prisma;

  const whereCondition: any = {
    issues: { none: {} },
    projects: { none: {} },
  };

  if (tagIds && tagIds.length > 0) {
    whereCondition.id = { in: tagIds };
  }

  try {
    const result = await db.tag.deleteMany({
      where: whereCondition,
    });
    return result.count;
  } catch (err: any) {
    console.warn(`⚠️ [cleanupUnusedTags] 태그 자동 정리 중 경고:`, err.message);
    return 0;
  }
};
