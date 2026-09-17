import { prisma, type PrismaTx } from '#lib/prisma.js';

export const deleteTagService = async (id: number, tx?: PrismaTx) => {
  const db = tx ?? prisma;
  const targetId = Number(id);
  if (!targetId) throw new Error('Tag ID is required');

  return await db.tag.delete({
    where: { id: targetId },
  });
};
