import { Router } from 'express';
import { getActivityLogsController, createActivityLogController } from './activityLogs.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const activityLogRouter = Router();

activityLogRouter.get('/', requireAuth, getActivityLogsController);
activityLogRouter.post('/', requireAuth, createActivityLogController);

