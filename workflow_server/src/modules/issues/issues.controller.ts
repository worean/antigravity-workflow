import { Request, Response } from 'express';
import { createIssueService } from './services/createIssue.service.js';
import { getIssuesService } from './services/getIssues.service.js';
import { getIssueService } from './services/getIssue.service.js';
import { updateIssueService } from './services/updateIssue.service.js';
import { deleteIssueService } from './services/deleteIssue.service.js';
import { likeIssueService, unlikeIssueService } from './services/likeIssue.service.js';
import { toggleLikeIssueService } from './services/toggleLikeIssue.service.js';
import { ErrorCode } from '../../common/errors/errorCode.js';

export const createIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const issueData = { ...req.body, authorId: req.user.id };
    const issue = await createIssueService(issueData);
    res.status(201).json(issue);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const getIssues = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user ? req.user.id : undefined;
    const result = await getIssuesService(req.query, currentUserId);

    res.setHeader('X-Total-Count', String(result.total));
    res.setHeader('X-Page', String(result.page));
    res.setHeader('X-Limit', String(result.limit));
    res.setHeader('X-Total-Pages', String(result.totalPages));

    if (req.query.withMeta === 'true' || req.query.format === 'object') {
      res.json(result);
    } else {
      res.json(result.items);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message, errorCode: ErrorCode.INTERNAL_SERVER_ERROR });
  }
};

export const getIssue = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user ? req.user.id : undefined;
    const issue = await getIssueService(Number(req.params.id || req.query.id), currentUserId);
    res.json(issue);
  } catch (error: any) {
    const isNotFound = error.message.includes('not found');
    res.status(isNotFound ? 404 : 400).json({
      error: error.message,
      errorCode: isNotFound ? ErrorCode.NOT_FOUND : ErrorCode.INVALID_INPUT,
    });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const updateData = { ...req.body, userId: req.user.id };
    const updated = await updateIssueService(Number(req.params.id || req.body.id), updateData);
    res.json(updated);
  } catch (error: any) {
    const isRestricted = error.message.includes('Restricted field modification');
    res.status(isRestricted ? 403 : 400).json({
      error: error.message,
      errorCode: isRestricted ? ErrorCode.RESTRICTED_PERMISSION : ErrorCode.INVALID_INPUT,
    });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const result = await deleteIssueService(Number(req.params.id || req.body.id), req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const likeIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const targetIssueId = Number(req.body.issueId || req.body.id);
    const result = await likeIssueService(targetIssueId, req.user.id);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const unlikeIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const targetIssueId = Number(req.body.issueId || req.body.id);
    const result = await unlikeIssueService(targetIssueId, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const toggleLikeIssue = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const targetIssueId = Number(req.body.issueId || req.body.id);
    const result = await toggleLikeIssueService(targetIssueId, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};
