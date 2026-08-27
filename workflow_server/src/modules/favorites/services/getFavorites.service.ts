// -*- coding: utf-8 -*-
import { prisma, type PrismaTx } from '#lib/prisma.js';

export interface GetFavoritesParams {
  userId: number;
  targetType?: string;
  tx?: PrismaTx;
}

export interface FavoriteItemWithDetail {
  id: number;
  targetType: string;
  targetId: number;
  createdAt: Date;
  detail?: any;
}

export const getFavoritesService = async ({
  userId,
  targetType,
  tx,
}: GetFavoritesParams): Promise<FavoriteItemWithDetail[]> => {
  const db = tx ?? prisma;

  const whereClause: any = { userId };
  if (targetType) {
    whereClause.targetType = targetType;
  }

  const favorites = await db.favorite.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 대상별 상세 메타데이터 연결
  const projectIds = favorites.filter((f) => f.targetType === 'PROJECT').map((f) => f.targetId);
  const issueIds = favorites.filter((f) => f.targetType === 'ISSUE').map((f) => f.targetId);
  const sprintIds = favorites.filter((f) => f.targetType === 'SPRINT').map((f) => f.targetId);
  const channelIds = favorites.filter((f) => f.targetType === 'CHAT_CHANNEL').map((f) => f.targetId);

  const [projects, issues, sprints, channels] = await Promise.all([
    projectIds.length > 0 ? db.project.findMany({ where: { id: { in: projectIds } } }) : [],
    issueIds.length > 0
      ? db.issue.findMany({
          where: { id: { in: issueIds } },
          include: {
            project: { select: { id: true, name: true, key: true } },
            author: { select: { id: true, name: true, email: true, avatar: true } },
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
          },
        })
      : [],
    sprintIds.length > 0
      ? db.sprint.findMany({
          where: { id: { in: sprintIds } },
          include: {
            project: { select: { id: true, name: true, key: true } },
            issues: {
              select: {
                id: true,
                title: true,
                statusId: true,
                priorityId: true,
                status: true,
                priority: true,
                plannedStartDate: true,
                dueDate: true,
                progress: true,
                assignee: { select: { id: true, name: true, email: true, avatar: true } },
              },
            },
            _count: { select: { issues: true } },
          },
        })
      : [],
    channelIds.length > 0
      ? db.chatChannel.findMany({
          where: { id: { in: channelIds } },
          include: {
            project: { select: { id: true, name: true, key: true } },
            group: { select: { id: true, name: true } },
          },
        })
      : [],
  ]);

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const issueMap = new Map(issues.map((i) => [i.id, i]));
  const sprintMap = new Map(sprints.map((s) => [s.id, s]));
  const channelMap = new Map(channels.map((c) => [c.id, c]));

  return favorites.map((f) => {
    let detail: any = null;
    if (f.targetType === 'PROJECT') detail = projectMap.get(f.targetId) || null;
    else if (f.targetType === 'ISSUE') detail = issueMap.get(f.targetId) || null;
    else if (f.targetType === 'SPRINT') detail = sprintMap.get(f.targetId) || null;
    else if (f.targetType === 'CHAT_CHANNEL') detail = channelMap.get(f.targetId) || null;

    return {
      id: f.id,
      targetType: f.targetType,
      targetId: f.targetId,
      createdAt: f.createdAt,
      detail,
    };
  });
};