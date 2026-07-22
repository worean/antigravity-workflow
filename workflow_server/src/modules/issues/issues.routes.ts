import { Router } from 'express';
import * as issuesController from './issues.controller.js';
import { requireAuth, optionalAuth } from '../../common/middlewares/authMiddleware.js';

export const issueRouter = Router();

// 공개/조회 엔드포인트 (optionalAuth를 적용해 토큰/사용자 정보가 제공되면 사용자 맞춤 데이터 isLiked 등 제공)
issueRouter.get('/', optionalAuth, issuesController.getIssues);
issueRouter.get('/list', optionalAuth, issuesController.getIssues);
issueRouter.get('/get/:id', optionalAuth, issuesController.getIssue);
issueRouter.get('/:id', optionalAuth, issuesController.getIssue);

// 인증/사용자 정보가 수신되는 CUD 및 액션 엔드포인트
issueRouter.post('/create', requireAuth, issuesController.createIssue);
issueRouter.put('/update/:id', requireAuth, issuesController.updateIssue);
issueRouter.put('/update', requireAuth, issuesController.updateIssue);
issueRouter.delete('/delete/:id', requireAuth, issuesController.deleteIssue);
issueRouter.delete('/:id', requireAuth, issuesController.deleteIssue);

// 좋아요 & 좋아요 취소 (토큰 또는 Body의 auth/user/userId 수신)
issueRouter.post('/like', requireAuth, issuesController.likeIssue);
issueRouter.post('/unlike', requireAuth, issuesController.unlikeIssue);
