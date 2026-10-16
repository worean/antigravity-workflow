import { prisma } from '#lib/prisma.js';

interface LinkCommitToWorklogParams {
  workspaceId: number;
  worklogId: number;
  repoMappingId: number;
  commitHash: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  committedAt?: string | Date;
  url?: string;
}

export async function linkCommitToWorklogService(params: LinkCommitToWorklogParams) {
  const {
    workspaceId,
    worklogId,
    repoMappingId,
    commitHash,
    message,
    authorName,
    authorEmail,
    committedAt,
    url,
  } = params;

  if (!commitHash || !commitHash.trim()) {
    throw new Error('커밋 해시가 필요합니다.');
  }

  const worklog = await prisma.worklog.findUnique({
    where: { id: worklogId },
    include: { issue: { select: { id: true, projectId: true } } },
  });

  if (!worklog) {
    throw new Error('대상 작업로그를 찾을 수 없습니다.');
  }

  const mapping = await prisma.gitRepositoryMapping.findFirst({
    where: { id: repoMappingId },
  });
  if (!mapping) {
    throw new Error('유효한 저장소 매핑 정보를 찾을 수 없습니다.');
  }

  const dateValue = committedAt ? new Date(committedAt) : new Date();
  const cleanHash = commitHash.trim();
  const cleanMessage = message.trim() || 'Commit linked';
  const cleanAuthor = authorName.trim() || 'unknown';

  // 1. 작업로그는 1개 커밋만 연결 (worklogId 기준으로 upsert)
  const worklogCommit = await prisma.gitWorklogCommitLink.upsert({
    where: { worklogId },
    update: {
      repoMappingId,
      commitHash: cleanHash,
      message: cleanMessage,
      authorName: cleanAuthor,
      authorEmail: authorEmail?.trim() || null,
      committedAt: dateValue,
      url: url?.trim() || null,
    },
    create: {
      worklogId,
      repoMappingId,
      commitHash: cleanHash,
      message: cleanMessage,
      authorName: cleanAuthor,
      authorEmail: authorEmail?.trim() || null,
      committedAt: dateValue,
      url: url?.trim() || null,
    },
    include: {
      repoMapping: { select: { id: true, repoIdentifier: true } },
    },
  });

  // 2. 작업로그로 커밋 등록 시 해당 이슈(issueId)에도 커밋을 자동 귀속/연결
  if (worklog.issueId) {
    await prisma.gitCommitLink.upsert({
      where: {
        repoMappingId_commitHash_issueId: {
          repoMappingId,
          commitHash: cleanHash,
          issueId: worklog.issueId,
        },
      },
      update: {
        message: cleanMessage,
        authorName: cleanAuthor,
        authorEmail: authorEmail?.trim() || null,
        committedAt: dateValue,
        url: url?.trim() || null,
      },
      create: {
        repoMappingId,
        commitHash: cleanHash,
        issueId: worklog.issueId,
        message: cleanMessage,
        authorName: cleanAuthor,
        authorEmail: authorEmail?.trim() || null,
        committedAt: dateValue,
        url: url?.trim() || null,
      },
    }).catch(() => {
      // 이슈 커밋 upsert 실패 시 작업로그 연동은 유지
    });
  }

  return worklogCommit;
}
