import { Request, Response } from 'express';
import { createMemoService } from './services/createMemo.service.js';
import { getMemosService } from './services/getMemos.service.js';
import { getMemoService } from './services/getMemo.service.js';
import { getMemoByTitleService } from './services/getMemoByTitle.service.js';
import { updateMemoService } from './services/updateMemo.service.js';
import { deleteMemoService } from './services/deleteMemo.service.js';
import { uploadMemoAttachmentService } from './services/uploadMemoAttachment.service.js';
import { deleteMemoAttachmentService } from './services/deleteMemoAttachment.service.js';
import { downloadMemoAttachmentService } from './services/downloadMemoAttachment.service.js';

export const createMemoController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, content, isPublic, workspaceId } = req.body;
    const memo = await createMemoService(
      { title, content, isPublic, workspaceId },
      userId
    );
    return res.status(201).json(memo);
  } catch (err: any) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || '메모 생성에 실패했습니다.' });
  }
};

export const getMemosController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { search, filter, workspaceId } = req.query;
    const memos = await getMemosService(userId, {
      search: search ? String(search) : undefined,
      filter: filter as any,
      workspaceId: workspaceId ? Number(workspaceId) : 1,
    });
    return res.json(memos);
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || '메모 목록 조회에 실패했습니다.' });
  }
};

export const getMemoController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const memoId = Number(req.params.id);
    const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : 1;
    const memo = await getMemoService(memoId, userId, workspaceId);
    return res.json(memo);
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || '메모 조회에 실패했습니다.' });
  }
};

export const getMemoByTitleController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title } = req.params;
    const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : 1;
    const memo = await getMemoByTitleService(decodeURIComponent(title), userId, workspaceId);
    return res.json(memo);
  } catch (err: any) {
    const status = err.status || 404;
    return res.status(status).json({ error: err.message || '메모를 찾을 수 없습니다.' });
  }
};

export const updateMemoController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const memoId = Number(req.params.id);
    const workspaceId = req.body.workspaceId ? Number(req.body.workspaceId) : 1;
    const { title, content, isPublic } = req.body;
    const updated = await updateMemoService(memoId, userId, { title, content, isPublic }, workspaceId);
    return res.json(updated);
  } catch (err: any) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || '메모 수정에 실패했습니다.' });
  }
};

export const deleteMemoController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const memoId = Number(req.params.id);
    const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : 1;
    const result = await deleteMemoService(memoId, userId, workspaceId);
    return res.json(result);
  } catch (err: any) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || '메모 삭제에 실패했습니다.' });
  }
};

export const uploadMemoAttachmentController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const memoId = Number(req.params.id);
    const { fileName, fileSize, fileUrl, fileType, workspaceId } = req.body;
    const attachment = await uploadMemoAttachmentService(
      memoId,
      userId,
      { fileName, fileSize, fileUrl, fileType },
      workspaceId ? Number(workspaceId) : 1
    );
    return res.status(201).json(attachment);
  } catch (err: any) {
    const status = err.status || 400;
    return res.status(status).json({
      error: err.code || 'ATTACHMENT_UPLOAD_FAILED',
      message: err.message || '첨부파일 등록에 실패했습니다.',
    });
  }
};

export const deleteMemoAttachmentController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const memoId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);
    const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : 1;
    const result = await deleteMemoAttachmentService(memoId, attachmentId, userId, workspaceId);
    return res.json(result);
  } catch (err: any) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || '첨부파일 삭제에 실패했습니다.' });
  }
};

export const downloadMemoAttachmentController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const memoId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);
    const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : 1;

    const attachment = await downloadMemoAttachmentService(memoId, attachmentId, userId, workspaceId);

    // Data URL인 경우 (Base64) 디코딩하여 순수 바이너리 스트림/버퍼로 응답
    if (attachment.fileUrl && attachment.fileUrl.startsWith('data:')) {
      const commaIdx = attachment.fileUrl.indexOf(',');
      const metaPart = attachment.fileUrl.substring(0, commaIdx);
      const base64Data = attachment.fileUrl.substring(commaIdx + 1);

      const mimeMatch = metaPart.match(/data:([^;]+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : (attachment.fileType || 'application/octet-stream');

      const fileBuffer = Buffer.from(base64Data, 'base64');
      const encodedFilename = encodeURIComponent(attachment.fileName);

      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader('Content-Length', fileBuffer.length);
      return res.end(fileBuffer);
    }

    // 일반 URL인 경우 해당 URL로 리다이렉트
    return res.redirect(attachment.fileUrl);
  } catch (err: any) {
    const status = err.status || 400;
    return res.status(status).json({ error: err.message || '첨부파일 다운로드에 실패했습니다.' });
  }
};

