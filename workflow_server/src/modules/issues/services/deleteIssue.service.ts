import { prisma } from '#lib/prisma.js';

export const deleteIssueService = async (id: number) => {
  if (!id) throw new Error('Issue ID is required');
  await prisma.issue.delete({ where: { id } });
  return { message: 'Issue/Task deleted successfully' };
};
