import { prisma, type PrismaTx } from '#lib/prisma.js';
import { getTagColor } from './extractTags.js';

export const createTagService = async (
  data: { name: string; color?: string },
  tx?: PrismaTx
) => {
  const db = tx ?? prisma;
  const rawName = String(data.name || '').trim().replace(/^#/, '');
  if (!rawName) throw new Error('Tag name is required');

  const color = data.color || getTagColor(rawName);

  return await db.tag.upsert({
    where: { name: rawName },
    update: { color: data.color ? data.color : undefined },
    create: {
      name: rawName,
      color,
    },
  });
};
