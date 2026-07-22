import { prisma } from '#lib/prisma.js';

export const addMemberService = async (projectId: number, userId: number, role?: string) => {
  if (!projectId || !userId) throw new Error('projectId and userId are required');
  return await prisma.projectMember.create({
    data: {
      projectId,
      userId,
      role: role || 'MEMBER'
    }
  });
};
