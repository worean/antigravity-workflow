import { Request, Response } from 'express';
import { createIssueService } from './services/createIssue.service.js';
import { getIssuesService } from './services/getIssues.service.js';
import { getIssueService } from './services/getIssue.service.js';
import { updateIssueService } from './services/updateIssue.service.js';
import { deleteIssueService } from './services/deleteIssue.service.js';
import { likeIssueService, unlikeIssueService } from './services/likeIssue.service.js';

export const createIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required' });
    const issueData = { ...req.body, authorId: req.user.id };
    const issue = await createIssueService(issueData);
    res.status(201).json(issue);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getIssues = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user ? req.user.id : undefined;
    const issues = await getIssuesService(req.query, currentUserId);
    res.json(issues);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getIssue = async (req: Request, res: Response) => {
  try {
    const issue = await getIssueService(Number(req.params.id || req.query.id));
    res.json(issue);
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required' });
    const updateData = { ...req.body, userId: req.user.id };
    const updated = await updateIssueService(Number(req.params.id || req.body.id), updateData);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required' });
    const result = await deleteIssueService(Number(req.params.id || req.body.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const likeIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required' });
    const targetIssueId = Number(req.body.issueId || req.body.id);
    const result = await likeIssueService(targetIssueId, req.user.id);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const unlikeIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required' });
    const targetIssueId = Number(req.body.issueId || req.body.id);
    const result = await unlikeIssueService(targetIssueId, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
