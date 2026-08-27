// -*- coding: utf-8 -*-
import { prisma, type PrismaTx } from '#lib/prisma.js';

export interface GetUserFavoriteIdsParams {
  userId: number;
  targetType: 'PROJECT' | 'ISSUE' | 'SPRINT' | 'CHAT_CHANNEL' | string;
  tx?: PrismaTx;
}

export const getUserFavoriteIdsService = async ({
  userId,
  targetType,
  tx,
}: GetUserFavoriteIdsParams): Promise<Set<number>> => {
  const db = tx ?? prisma;

  const list = await db.favorite.findMany({
    where: {
      userId,
      targetType,
    },
    select: {
      targetId: true,
    },
  });

  return new Set(list.map((f) => f.targetId));
};