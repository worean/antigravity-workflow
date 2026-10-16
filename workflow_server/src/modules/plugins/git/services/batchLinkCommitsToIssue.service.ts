import { prisma } from '#lib/prisma.js';

export interface BatchCommitItem {
  repoMappingId: number;
  commitHash: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  committedAt?: string | Date;
  url?: string;
}

interface BatchLinkCommitsParams {
  workspaceId: number;
  issueId: number;
  commits: BatchCommitItem[];
}

export async function batchLinkCommitsToIssueService(params: BatchLinkCommitsParams) {
  const { workspaceId, issueId, commits } = params;

  if (!Array.isArray(commits) || commits.length === 0) {
    throw new Error('등록할 커밋 목록(commits)이 필요합니다.');
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, projectId: true },
  });
  if (!issue) {
    throw new Error('대상 이슈를 찾을 수 없습니다.');
  }

  const results = [];
  for (const c of commits) {
    if (!c.commitHash || !c.commitHash.trim()) continue;
    const cleanHash = c.commitHash.trim();
    const dateValue = c.committedAt ? new Date(c.committedAt) : new Date();

    const link = await prisma.gitCommitLink.upsert({
      where: {
        repoMappingId_commitHash_issueId: {
          repoMappingId: Number(c.repoMappingId),
          commitHash: cleanHash,
          issueId,
        },
      },
      update: {
        message: String(c.message || 'Commit linked').trim(),
        authorName: String(c.authorName || 'unknown').trim(),
        authorEmail: c.authorEmail ? String(c.authorEmail).trim() : null,
        committedAt: dateValue,
        url: c.url ? String(c.url).trim() : null,
      },
      create: {
        repoMappingId: Number(c.repoMappingId),
        commitHash: cleanHash,
        issueId,
        message: String(c.message || 'Commit linked').trim(),
        authorName: String(c.authorName || 'unknown').trim(),
        authorEmail: c.authorEmail ? String(c.authorEmail).trim() : null,
        committedAt: dateValue,
        url: c.url ? String(c.url).trim() : null,
      },
      include: {
        repoMapping: { select: { id: true, repoIdentifier: true } },
      },
    });
    results.push(link);
  }

  return {
    totalRequested: commits.length,
    totalLinked: results.length,
    commits: results,
  };
}
