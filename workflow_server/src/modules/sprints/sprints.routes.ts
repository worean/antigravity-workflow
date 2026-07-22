import { Router } from 'express';
import * as sprintsController from './sprints.controller.js';

export const sprintRouter = Router();

sprintRouter.get('/', sprintsController.getSprints);
sprintRouter.get('/list', sprintsController.getSprints);
sprintRouter.post('/create', sprintsController.createSprint);
sprintRouter.put('/update/:id', sprintsController.updateSprint);
sprintRouter.put('/update', sprintsController.updateSprint);
