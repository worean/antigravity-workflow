import { Request, Response } from 'express';
import { getActivityLogsService } from './services/getActivityLogs.service.js';
import { createActivityLogService } from './services/createActivityLog.service.js';

export const getActivityLogsController = async (req: Request, res: Response) => {
  try {
    const result = await getActivityLogsService(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createActivityLogController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || req.body.userId;
    const log = await createActivityLogService({
      ...req.body,
      userId: userId ? Number(userId) : undefined,
      ipAddress: req.ip
    });
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
