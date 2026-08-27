// -*- coding: utf-8 -*-
import { prisma, type PrismaTx } from '#lib/prisma.js';

export interface ToggleFavoriteParams {
  userId: number;
  targetType: 'PROJECT' | 'ISSUE' | 'SPRINT' | 'CHAT_CHANNEL';
  targetId: number;
  tx?: PrismaTx;
}

export interface ToggleFavoriteResult {
  isFavorite: boolean;
  targetType: string;
  targetId: number;
}

export const toggleFavoriteService = async ({
  userId,
  targetType,
  targetId,
  tx,
}: ToggleFavoriteParams): Promise<ToggleFavoriteResult> => {
  const db = tx ?? prisma;

  const existing = await db.favorite.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType,
        targetId,
      },
    },
  });

  if (existing) {
    await db.favorite.delete({
      where: {
        id: existing.id,
      },
    });
    return {
      isFavorite: false,
      targetType,
      targetId,
    };
  }

  await db.favorite.create({
    data: {
      userId,
      targetType,
      targetId,
    },
  });

  return {
    isFavorite: true,
    targetType,
    targetId,
  };
};