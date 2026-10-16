import { prisma } from '#lib/prisma.js';

export const createWorklogService = async (issueId: number, data: any) => {
  const { userId, timeSpent, timeSpentHours, description, startedAt } = data;

  let finalMinutes: number;
  if (timeSpentHours !== undefined && timeSpentHours !== null) {
    finalMinutes = Math.round(Number(timeSpentHours) * 60);
  } else if (timeSpent !== undefined && timeSpent !== null) {
    finalMinutes = Math.round(Number(timeSpent));
  } else {
    throw new Error('timeSpent or timeSpentHours is required');
  }

  if (!issueId || !userId || isNaN(finalMinutes) || finalMinutes <= 0) {
    throw new Error('Valid issueId, userId, and positive time duration are required');
  }

  const worklog = await prisma.worklog.create({
    data: {
      issueId: Number(issueId),
      userId: Number(userId),
      timeSpent: finalMinutes,
      description: description ? String(description) : undefined,
      startedAt: startedAt ? new Date(startedAt) : undefined
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } }
    }
  });

  const hoursToIncrement = finalMinutes / 60.0;
  await prisma.issue.update({
    where: { id: Number(issueId) },
    data: { loggedHours: { increment: hoursToIncrement } }
  });

  if (data.gitCommit && data.gitCommit.commitHash && data.gitCommit.repoMappingId) {
    const repoMappingId = Number(data.gitCommit.repoMappingId);
    const commitHash = String(data.gitCommit.commitHash).trim();
    const message = String(data.gitCommit.message || 'Worklog commit').trim();
    const authorName = String(data.gitCommit.authorName || 'unknown').trim();
    const authorEmail = data.gitCommit.authorEmail ? String(data.gitCommit.authorEmail).trim() : null;
    const committedAt = data.gitCommit.committedAt ? new Date(data.gitCommit.committedAt) : new Date();
    const url = data.gitCommit.url ? String(data.gitCommit.url).trim() : null;

    // 1. 작업로그에 커밋 연결 (1:1)
    await prisma.gitWorklogCommitLink.create({
      data: {
        worklogId: worklog.id,
        repoMappingId,
        commitHash,
        message,
        authorName,
        authorEmail,
        committedAt,
        url,
      },
    });

    // 2. 작업로그 생성 시 연결된 커밋을 해당 이슈에도 자동 등록 (AI/Workflow 원스톱 연동)
    await prisma.gitCommitLink.upsert({
      where: {
        repoMappingId_commitHash_issueId: {
          repoMappingId,
          commitHash,
          issueId: Number(issueId),
        },
      },
      update: {
        message,
        authorName,
        authorEmail,
        committedAt,
        url,
      },
      create: {
        repoMappingId,
        commitHash,
        issueId: Number(issueId),
        message,
        authorName,
        authorEmail,
        committedAt,
        url,
      },
    }).catch(() => {});
  }

  const result = await prisma.worklog.findUnique({
    where: { id: worklog.id },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      gitCommit: {
        include: {
          repoMapping: { select: { id: true, repoIdentifier: true } },
        },
      },
    },
  });

  return result || worklog;
};


