import { prisma } from '#lib/prisma.js';

export const createAttachmentService = async (data: any) => {
  const { filename, originalName, mimeType, size, url, thumbnailUrl, mediaType, width, height, duration, issueId, commentId, uploaderId } = data;
  if (!filename || !originalName || !url || !uploaderId) {
    throw new Error('filename, originalName, url, and uploaderId are required');
  }

  return await prisma.attachment.create({
    data: {
      filename,
      originalName,
      mimeType,
      size: Number(size || 0),
      url,
      thumbnailUrl,
      mediaType: mediaType || 'FILE',
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      duration: duration ? Number(duration) : undefined,
      issueId: issueId ? Number(issueId) : undefined,
      commentId: commentId ? Number(commentId) : undefined,
      uploaderId: Number(uploaderId)
    }
  });
};
