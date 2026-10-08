import { Router } from 'express';
import {
  getSystemHealthController,
  getSystemVersionController,
} from './system.controller.js';

export const systemRouter = Router();

systemRouter.get('/health', getSystemHealthController);
systemRouter.get('/version', getSystemVersionController);
