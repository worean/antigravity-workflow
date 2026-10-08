import { Router } from 'express';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';
import {
  createMemoController,
  getMemosController,
  getMemoController,
  getMemoByTitleController,
  updateMemoController,
  deleteMemoController,
  uploadMemoAttachmentController,
  deleteMemoAttachmentController,
} from './memos.controller.js';

export const memoRouter = Router();

// 모든 메모 엔드포인트는 인증 필수 (워크스페이스 격리)
memoRouter.use(requireAuth);

memoRouter.get('/', getMemosController);
memoRouter.post('/', createMemoController);
memoRouter.get('/by-title/:title', getMemoByTitleController);
memoRouter.get('/:id', getMemoController);
memoRouter.put('/:id', updateMemoController);
memoRouter.delete('/:id', deleteMemoController);

// 첨부파일 관리
memoRouter.post('/:id/attachments', uploadMemoAttachmentController);
memoRouter.delete('/:id/attachments/:attachmentId', deleteMemoAttachmentController);
