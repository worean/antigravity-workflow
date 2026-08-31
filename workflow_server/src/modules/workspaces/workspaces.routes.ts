// -*- coding: utf-8 -*-
import { Router } from 'express';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';
import { requireWorkspaceAccess, requireWorkspaceRole } from '../../common/middlewares/workspaceMiddleware.js';
import {
  createWorkspaceController,
  getMyWorkspacesController,
  getWorkspaceDetailController,
  inviteMemberController,
  removeMemberController,
  updateWorkspaceController,
  deleteWorkspaceController,
} from './workspaces.controller.js';

export const workspaceRouter = Router();

// 내 워크스페이스 목록 조회 및 신규 생성
workspaceRouter.get('/', requireAuth, getMyWorkspacesController);
workspaceRouter.post('/', requireAuth, createWorkspaceController);

// 특정 워크스페이스 상세 조회
workspaceRouter.get('/:id', requireAuth, requireWorkspaceAccess, getWorkspaceDetailController);

// 워크스페이스 멤버 초대 및 관리 (ADMIN 이상)
workspaceRouter.post('/:id/invite', requireAuth, requireWorkspaceAccess, requireWorkspaceRole('ADMIN'), inviteMemberController);
workspaceRouter.delete('/:id/members/:userId', requireAuth, requireWorkspaceAccess, requireWorkspaceRole('ADMIN'), removeMemberController);

// 워크스페이스 정보 수정 (ADMIN 이상) 및 삭제 (OWNER 전용)
workspaceRouter.put('/:id', requireAuth, requireWorkspaceAccess, requireWorkspaceRole('ADMIN'), updateWorkspaceController);
workspaceRouter.delete('/:id', requireAuth, requireWorkspaceAccess, requireWorkspaceRole('OWNER'), deleteWorkspaceController);
