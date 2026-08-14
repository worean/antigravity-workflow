import { Request, Response } from 'express';
import { createWorklogService } from './services/createWorklog.service.js';
import { getWorklogsService } from './services/getWorklogs.service.js';

export const getWorklogs = async (req: Request, res: Response) => {
  try {
    const issueId = req.params.issueId || req.query.issueId;
    const userId = req.query.userId;
    const worklogs = await getWorklogsService({
      issueId: issueId ? Number(issueId) : undefined,
      userId: userId ? Number(userId) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined
    });
    res.json(worklogs);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createWorklog = async (req: Request, res: Response) => {
  try {
    const issueId = Number(req.params.issueId || req.body.issueId);
    const userId = req.user ? req.user.id : Number(req.body.userId);
    const worklog = await createWorklogService(issueId, { ...req.body, userId });
    res.status(201).json(worklog);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

