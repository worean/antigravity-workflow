import { Router } from 'express';
import * as worklogsController from './worklogs.controller.js';

export const worklogRouter = Router();

worklogRouter.post('/create', worklogsController.createWorklog);
worklogRouter.post('/create/:issueId', worklogsController.createWorklog);
