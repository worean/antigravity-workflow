import { Router } from 'express';
import * as sprintsController from './sprints.controller.js';
import { requireAuth, optionalAuth } from '../../common/middlewares/authMiddleware.js';

export const sprintRouter = Router();

// 표준 RESTful 라우트
sprintRouter.get('/', optionalAuth, sprintsController.getSprints);
sprintRouter.post('/', requireAuth, sprintsController.createSprint);
sprintRouter.get('/:id', optionalAuth, sprintsController.getSprint);
sprintRouter.put('/:id', requireAuth, sprintsController.updateSprint);
sprintRouter.delete('/:id', requireAuth, sprintsController.deleteSprint);
sprintRouter.post('/:id/issues', requireAuth, sprintsController.assignIssuesToSprint);
sprintRouter.put('/:id/assign-issues', requireAuth, sprintsController.assignIssuesToSprint);
sprintRouter.get('/:id/discussions', optionalAuth, sprintsController.getSprintDiscussions);
sprintRouter.get('/:id/worklogs', optionalAuth, sprintsController.getSprintWorklogs);

// 레거시 라우트 하위 호환 지원
sprintRouter.get('/list', optionalAuth, sprintsController.getSprints);
sprintRouter.post('/create', requireAuth, sprintsController.createSprint);
sprintRouter.put('/update/:id', requireAuth, sprintsController.updateSprint);
sprintRouter.put('/update', requireAuth, sprintsController.updateSprint);
sprintRouter.delete('/delete/:id', requireAuth, sprintsController.deleteSprint);