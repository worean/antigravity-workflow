import { prisma } from '#lib/prisma.js';

interface UnlinkCommitFromWorklogParams {
  workspaceId: number;
  worklogId: number;
}

export async function unlinkCommitFromWorklogService(params: UnlinkCommitFromWorklogParams) {
  const { worklogId } = params;

  await prisma.gitWorklogCommitLink.deleteMany({
    where: { worklogId },
  });

  return { success: true, worklogId };
}
