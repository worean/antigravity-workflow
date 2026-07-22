import { Request, Response } from 'express';
import { createWorklogService } from './services/createWorklog.service.js';

export const createWorklog = async (req: Request, res: Response) => {
  try {
    const issueId = Number(req.params.issueId || req.body.issueId);
    const worklog = await createWorklogService(issueId, req.body);
    res.status(201).json(worklog);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
