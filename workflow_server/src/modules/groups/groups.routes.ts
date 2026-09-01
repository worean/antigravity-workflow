import { Router } from 'express';
import * as groupsController from './groups.controller.js';
import { requireAuth, requireAdmin } from '../../common/middlewares/authMiddleware.js';

export const groupRouter = Router();

// ==========================================
// 🏢 Groups & Organization Routes
// ==========================================

// 조회 라우트 (로그인 유저 접근 가능)
groupRouter.get('/', requireAuth, groupsController.getGroups);
groupRouter.get('/:id', requireAuth, groupsController.getGroup);

// 그룹 생성 / 수정 / 삭제 라우트 (관리자 또는 인증 유저)
groupRouter.post('/', requireAuth, groupsController.createGroup);
groupRouter.put('/:id', requireAuth, groupsController.updateGroup);
groupRouter.delete('/:id', requireAuth, groupsController.deleteGroup);

// 그룹 멤버 관리 라우트
groupRouter.post('/:id/members', requireAuth, groupsController.addGroupMember);
groupRouter.put('/:id/members/:userId', requireAuth, groupsController.updateGroupMember);
groupRouter.delete('/:id/members/:userId', requireAuth, groupsController.removeGroupMember);

