import { Router } from 'express';
import * as usersController from './users.controller.js';

export const userRouter = Router();

userRouter.get('/', usersController.getUsers);
userRouter.get('/list', usersController.getUsers);
userRouter.get('/get/:id', usersController.getUser);
userRouter.get('/:id', usersController.getUser);
userRouter.post('/create', usersController.createUser);
userRouter.put('/update/:id', usersController.updateUser);
userRouter.put('/update', usersController.updateUser);
userRouter.delete('/delete/:id', usersController.deleteUser);
userRouter.delete('/:id', usersController.deleteUser);
