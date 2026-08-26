// -*- coding: utf-8 -*-
import { Router } from 'express';
import * as issuesController from './issues.controller.js';
import { requireAuth, requireProjectMember, requireProjectPM } from '../../common/middlewares/authMiddleware.js';

export const issueRouter = Router();

// 1. Issue 조회 (로그인된 워크스페이스 사용자 조회 가능)
issueRouter.get('/', requireAuth, issuesController.getIssues);
issueRouter.get('/:id', requireAuth, issuesController.getIssue);

// 2. Issue 일괄 일정 수정 (Batch Schedule Updates)
issueRouter.put('/batch-schedules', requireAuth, issuesController.batchUpdateSchedules);
issueRouter.post('/batch-schedules', requireAuth, issuesController.batchUpdateSchedules);

// 3. Issue 생성 및 수정 (Project Member 또는 Project Owner 권한 필요)
issueRouter.post('/', requireAuth, requireProjectMember, issuesController.createIssue);
issueRouter.put('/:id', requireAuth, requireProjectMember, issuesController.updateIssue);

// 3. Issue 삭제 (오직 Project Manager(PM/Owner)만 가능)
issueRouter.delete('/:id', requireAuth, requireProjectPM, issuesController.deleteIssue);

// 4. 좋아요/반응 액션 (로그인 필요)
issueRouter.post('/like', requireAuth, issuesController.likeIssue);
issueRouter.post('/unlike', requireAuth, issuesController.unlikeIssue);
issueRouter.post('/toggle-like', requireAuth, issuesController.toggleLikeIssue);

// 레거시 지원 라우트 하위 호환성
issueRouter.get('/list', requireAuth, issuesController.getIssues);
issueRouter.get('/get/:id', requireAuth, issuesController.getIssue);
issueRouter.post('/create', requireAuth, requireProjectMember, issuesController.createIssue);
issueRouter.put('/update/:id', requireAuth, requireProjectMember, issuesController.updateIssue);
issueRouter.delete('/delete/:id', requireAuth, requireProjectPM, issuesController.deleteIssue);
