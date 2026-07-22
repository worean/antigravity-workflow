import { Router } from 'express';
import * as projectsController from './projects.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const projectRouter = Router();

projectRouter.get('/', projectsController.getProjects);
projectRouter.get('/list', projectsController.getProjects);
projectRouter.get('/get/:id', projectsController.getProject);
projectRouter.get('/:id', projectsController.getProject);
projectRouter.post('/create', requireAuth, projectsController.createProject);
projectRouter.post('/', requireAuth, projectsController.createProject);
projectRouter.put('/update/:id', requireAuth, projectsController.updateProject);
projectRouter.put('/update', requireAuth, projectsController.updateProject);
projectRouter.delete('/delete/:id', requireAuth, projectsController.deleteProject);
projectRouter.delete('/:id', requireAuth, projectsController.deleteProject);
projectRouter.post('/addMember', requireAuth, projectsController.addMember);
