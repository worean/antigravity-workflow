// -*- coding: utf-8 -*-
import { Router } from 'express';
import * as usersController from './users.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const userRouter = Router();

// 표준 RESTful API 라우트
userRouter.get('/', requireAuth, usersController.getUsers);
userRouter.get('/:id', requireAuth, usersController.getUser);
userRouter.post('/', usersController.createUser);
userRouter.put('/:id', requireAuth, usersController.updateUser);
userRouter.delete('/:id', requireAuth, usersController.deleteUser);

// 하위 호환 레거시 라우트
userRouter.get('/list', requireAuth, usersController.getUsers);
userRouter.get('/get/:id', requireAuth, usersController.getUser);
userRouter.post('/create', usersController.createUser);
userRouter.put('/update/:id', requireAuth, usersController.updateUser);
userRouter.delete('/delete/:id', requireAuth, usersController.deleteUser);
