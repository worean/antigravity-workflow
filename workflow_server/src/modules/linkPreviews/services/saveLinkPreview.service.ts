import { prisma } from '#lib/prisma.js';

export const saveLinkPreviewService = async (data: any) => {
  const { url, title, description, siteName, mediaType, imageUrl, embedHtml } = data;
  if (!url) throw new Error('url is required');

  return await prisma.linkPreview.upsert({
    where: { url },
    update: { title, description, siteName, mediaType, imageUrl, embedHtml, fetchedAt: new Date() },
    create: { url, title, description, siteName, mediaType, imageUrl, embedHtml }
  });
};
