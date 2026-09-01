import { Router } from 'express';
import {
  getTagsController,
  createTagController,
  deleteTagController,
} from './tags.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

const router = Router();

// 태그 목록 조회 (누구나 조회 가능)
router.get('/', getTagsController);

// 태그 생성/수정 (인증 필요)
router.post('/', requireAuth, createTagController);

// 태그 삭제 (인증 필요)
router.delete('/:id', requireAuth, deleteTagController);

export default router;
