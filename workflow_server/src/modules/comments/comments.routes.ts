import { Router } from 'express';
import * as commentsController from './comments.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const commentRouter = Router();

// 표준 RESTful 라우트 (로그인 필수)
commentRouter.get('/', requireAuth, commentsController.getComments);
commentRouter.get('/issue/:issueId', requireAuth, commentsController.getComments);
commentRouter.post('/', requireAuth, commentsController.createComment);
commentRouter.delete('/:id', requireAuth, commentsController.deleteComment);
commentRouter.post('/:id/reactions', requireAuth, commentsController.addReaction);

// 레거시 하위 호환 라우트
commentRouter.get('/list/:issueId', requireAuth, commentsController.getComments);
commentRouter.post('/create', requireAuth, commentsController.createComment);
commentRouter.post('/addReaction', requireAuth, commentsController.addReaction);
commentRouter.delete('/delete/:id', requireAuth, commentsController.deleteComment);
