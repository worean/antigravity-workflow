import { Router } from 'express';
import { handleChat } from './ai.controller.js';

export const aiRouter = Router();

// POST /api/ai/chat
aiRouter.post('/chat', handleChat);
