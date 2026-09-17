import { Router } from 'express';
import * as projectsController from './projects.controller.js';
import { requireAuth, requireProjectPM, requireProjectMember } from '../../common/middlewares/authMiddleware.js';

export const projectRouter = Router();

// 표준 RESTful 라우트
projectRouter.get('/', requireAuth, projectsController.getProjects);
projectRouter.get('/:id', requireAuth, projectsController.getProject);
projectRouter.post('/', requireAuth, projectsController.createProject); // 누구나 로그인 시 생성 가능 (PM으로 자동 등록)
projectRouter.put('/:id', requireAuth, requireProjectPM, projectsController.updateProject); // PM만 수정 가능
projectRouter.delete('/:id', requireAuth, requireProjectPM, projectsController.deleteProject); // PM만 삭제 가능

// Member 관리 (오직 PM만 수정 가능)
projectRouter.post('/:id/members', requireAuth, requireProjectPM, projectsController.addMember);
projectRouter.put('/:id/members/:userId', requireAuth, requireProjectPM, projectsController.updateMemberRole);
projectRouter.delete('/:id/members/:userId', requireAuth, requireProjectPM, projectsController.removeMember);
projectRouter.post('/addMember', requireAuth, requireProjectPM, projectsController.addMember);

// Group 관리 (오직 PM만 수정 가능)
projectRouter.post('/:id/groups', requireAuth, requireProjectPM, projectsController.addGroup);
projectRouter.put('/:id/groups/:groupId', requireAuth, requireProjectPM, projectsController.updateGroupRole);
projectRouter.delete('/:id/groups/:groupId', requireAuth, requireProjectPM, projectsController.removeGroup);

// 레거시 지원 라우트
projectRouter.get('/list', requireAuth, projectsController.getProjects);
projectRouter.get('/get/:id', requireAuth, projectsController.getProject);
projectRouter.post('/create', requireAuth, projectsController.createProject);
projectRouter.put('/update/:id', requireAuth, requireProjectPM, projectsController.updateProject);
projectRouter.delete('/delete/:id', requireAuth, requireProjectPM, projectsController.deleteProject);
