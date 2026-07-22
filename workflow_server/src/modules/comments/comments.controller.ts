import { Request, Response } from 'express';
import { createCommentService } from './services/createComment.service.js';
import { getCommentsService } from './services/getComments.service.js';
import { addReactionService } from './services/addReaction.service.js';
import { deleteCommentService } from './services/deleteComment.service.js';

export const createComment = async (req: Request, res: Response) => {
  try {
    const comment = await createCommentService(req.body);
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const comments = await getCommentsService(Number(req.params.issueId || req.query.issueId));
    res.json(comments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const addReaction = async (req: Request, res: Response) => {
  try {
    const commentId = Number(req.params.id || req.body.commentId);
    const { userId, emoji } = req.body;
    const reaction = await addReactionService(commentId, Number(userId), emoji);
    res.status(201).json(reaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const result = await deleteCommentService(Number(req.params.id || req.body.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
