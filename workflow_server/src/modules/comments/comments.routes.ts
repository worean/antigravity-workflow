import { Router } from 'express';
import * as commentsController from './comments.controller.js';

export const commentRouter = Router();

commentRouter.get('/list/:issueId', commentsController.getComments);
commentRouter.post('/create', commentsController.createComment);
commentRouter.post('/addReaction', commentsController.addReaction);
commentRouter.post('/:id/reactions', commentsController.addReaction);
commentRouter.delete('/delete/:id', commentsController.deleteComment);
commentRouter.delete('/:id', commentsController.deleteComment);
