import { prisma } from '#lib/prisma.js';

export interface GetActivityLogsQuery {
  entityType?: string;
  entityId?: number;
  userId?: number;
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const getActivityLogsService = async (query: GetActivityLogsQuery) => {
  const { entityType, entityId, userId, action, search, limit = 50, offset = 0 } = query;

  const where: any = {};

  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = Number(entityId);
  if (userId) where.userId = Number(userId);
  if (action) where.action = action;

  if (search) {
    where.OR = [
      { summary: { contains: String(search) } },
      { userName: { contains: String(search) } },
      { userEmail: { contains: String(search) } },
      { details: { contains: String(search) } }
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    }),
    prisma.activityLog.count({ where })
  ]);

  return {
    logs,
    total,
    limit: Number(limit),
    offset: Number(offset)
  };
};
