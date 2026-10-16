import { prisma } from '#lib/prisma.js';

interface LinkCommitToIssueParams {
  workspaceId: number;
  issueId: number;
  repoMappingId: number;
  commitHash: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  committedAt?: string | Date;
  url?: string;
}

export async function linkCommitToIssueService(params: LinkCommitToIssueParams) {
  const {
    workspaceId,
    issueId,
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
  if (!message || !message.trim()) {
    throw new Error('커밋 메시지가 필요합니다.');
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, projectId: true },
  });
  if (!issue) {
    throw new Error('대상 이슈를 찾을 수 없습니다.');
  }

  const mapping = await prisma.gitRepositoryMapping.findFirst({
    where: { id: repoMappingId },
  });
  if (!mapping) {
    throw new Error('유효한 저장소 매핑 정보를 찾을 수 없습니다.');
  }

  const dateValue = committedAt ? new Date(committedAt) : new Date();

  const commitLink = await prisma.gitCommitLink.upsert({
    where: {
      repoMappingId_commitHash_issueId: {
        repoMappingId,
        commitHash: commitHash.trim(),
        issueId,
      },
    },
    update: {
      message: message.trim(),
      authorName: authorName.trim() || 'unknown',
      authorEmail: authorEmail?.trim() || null,
      committedAt: dateValue,
      url: url?.trim() || null,
    },
    create: {
      repoMappingId,
      issueId,
      commitHash: commitHash.trim(),
      message: message.trim(),
      authorName: authorName.trim() || 'unknown',
      authorEmail: authorEmail?.trim() || null,
      committedAt: dateValue,
      url: url?.trim() || null,
    },
    include: {
      repoMapping: { select: { id: true, repoIdentifier: true } },
    },
  });

  return commitLink;
}
