import { Router } from 'express';
import * as worklogsController from './worklogs.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const worklogRouter = Router();

// 조회 라우트
worklogRouter.get('/', requireAuth, worklogsController.getWorklogs);
worklogRouter.get('/issue/:issueId', requireAuth, worklogsController.getWorklogs);

// 표준 RESTful 라우트
worklogRouter.post('/', requireAuth, worklogsController.createWorklog);

// 레거시 라우트 하위 호환 지원
worklogRouter.post('/create', requireAuth, worklogsController.createWorklog);
worklogRouter.post('/create/:issueId', requireAuth, worklogsController.createWorklog);

