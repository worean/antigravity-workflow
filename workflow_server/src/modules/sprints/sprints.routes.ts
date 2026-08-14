import { Router } from 'express';
import * as sprintsController from './sprints.controller.js';

export const sprintRouter = Router();

// 표준 RESTful 라우트
sprintRouter.get('/', sprintsController.getSprints);
sprintRouter.post('/', sprintsController.createSprint);
sprintRouter.put('/:id', sprintsController.updateSprint);

// 레거시 라우트 하위 호환 지원
sprintRouter.get('/list', sprintsController.getSprints);
sprintRouter.post('/create', sprintsController.createSprint);
sprintRouter.put('/update/:id', sprintsController.updateSprint);
sprintRouter.put('/update', sprintsController.updateSprint);
