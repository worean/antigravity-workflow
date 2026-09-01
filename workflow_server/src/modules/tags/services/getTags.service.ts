// -*- coding: utf-8 -*-
import { prisma, type PrismaTx } from '#lib/prisma.js';

export interface GetTagsQuery {
  search?: string;
  limit?: number;
  sortBy?: 'count' | 'name' | 'recent';
}

export const getTagsService = async (query: GetTagsQuery = {}, tx?: PrismaTx) => {
  const db = tx ?? prisma;
  const { search, limit = 50, sortBy = 'count' } = query;

  const where: any = {};
  if (search && search.trim()) {
    const cleanSearch = search.trim().replace(/^#/, '');
    where.name = { contains: cleanSearch };
  }

  const tags = await db.tag.findMany({
    where,
    include: {
      _count: {
        select: {
          issues: true,
          projects: true,
        },
      },
    },
    take: Number(limit),
  });

  const formatted = tags.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    issuesCount: tag._count.issues,
    projectsCount: tag._count.projects,
    totalCount: tag._count.issues + tag._count.projects,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  }));

  if (sortBy === 'count') {
    formatted.sort((a: any, b: any) => b.totalCount - a.totalCount || a.name.localeCompare(b.name));
  } else if (sortBy === 'name') {
    formatted.sort((a: any, b: any) => a.name.localeCompare(b.name));
  } else if (sortBy === 'recent') {
    formatted.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return formatted;
};
