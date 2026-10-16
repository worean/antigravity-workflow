import { prisma } from '#lib/prisma.js';

export async function getIssueGitDataService(issueId: number) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      title: true,
      issueNumber: true,
      projectId: true,
      project: {
        select: {
          id: true,
          key: true,
          name: true,
          gitMappings: {
            where: { isActive: true },
            select: {
              id: true,
              repoIdentifier: true,
              defaultBranch: true,
            },
          },
        },
      },
      gitPullRequests: {
        orderBy: { createdAt: 'desc' },
      },
      gitCommitLinks: {
        include: {
          repoMapping: {
            select: { id: true, repoIdentifier: true },
          },
        },
        orderBy: { committedAt: 'desc' },
      },

    },
  });

  if (!issue) {
    throw new Error('이슈를 찾을 수 없습니다.');
  }

  return {
    issueId: issue.id,
    issueNumber: issue.issueNumber,
    issueTitle: issue.title,
    projectKey: issue.project.key,
    availableRepositories: issue.project.gitMappings,
    pullRequests: issue.gitPullRequests.map((pr) => ({
      id: pr.id,
      prNumber: pr.prNumber,
      title: pr.title,
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch,
      state: pr.state,
      authorName: pr.authorName,
      url: pr.url,
      ciStatus: pr.ciStatus,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
    })),
    commits: issue.gitCommitLinks.map((c) => ({
      id: c.id,
      repoMappingId: c.repoMappingId,
      repoIdentifier: c.repoMapping?.repoIdentifier,
      commitHash: c.commitHash,
      message: c.message,
      authorName: c.authorName,
      authorEmail: c.authorEmail,
      committedAt: c.committedAt,
      createdAt: c.createdAt,
    })),

  };
}
