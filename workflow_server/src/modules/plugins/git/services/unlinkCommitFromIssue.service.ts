import { prisma } from '#lib/prisma.js';

interface UnlinkCommitFromIssueParams {
  workspaceId: number;
  issueId: number;
  commitLinkId: number;
}

export async function unlinkCommitFromIssueService(params: UnlinkCommitFromIssueParams) {
  const { issueId, commitLinkId } = params;

  const existing = await prisma.gitCommitLink.findFirst({
    where: { id: commitLinkId, issueId },
  });

  if (!existing) {
    throw new Error('삭제할 커밋 연결 내역을 찾을 수 없습니다.');
  }

  await prisma.gitCommitLink.delete({
    where: { id: commitLinkId },
  });

  return { success: true, commitLinkId };
}
