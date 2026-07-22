import { prisma } from '#lib/prisma.js';

export const getLinkPreviewService = async (url: string) => {
  if (!url) throw new Error('url is required');
  return await prisma.linkPreview.findUnique({ where: { url } });
};
