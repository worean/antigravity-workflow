// -*- coding: utf-8 -*-
import { Router } from 'express';
import * as sprintsController from './sprints.controller.js';

export const sprintRouter = Router();

// 표준 RESTful 라우트
sprintRouter.get('/', sprintsController.getSprints);
sprintRouter.post('/', sprintsController.createSprint);
sprintRouter.get('/:id', sprintsController.getSprint);
sprintRouter.put('/:id', sprintsController.updateSprint);
sprintRouter.delete('/:id', sprintsController.deleteSprint);
sprintRouter.post('/:id/issues', sprintsController.assignIssuesToSprint);
sprintRouter.put('/:id/assign-issues', sprintsController.assignIssuesToSprint);
sprintRouter.get('/:id/discussions', sprintsController.getSprintDiscussions);
sprintRouter.get('/:id/worklogs', sprintsController.getSprintWorklogs);

// 레거시 라우트 하위 호환 지원
sprintRouter.get('/list', sprintsController.getSprints);
sprintRouter.post('/create', sprintsController.createSprint);
sprintRouter.put('/update/:id', sprintsController.updateSprint);
sprintRouter.put('/update', sprintsController.updateSprint);
sprintRouter.delete('/delete/:id', sprintsController.deleteSprint);