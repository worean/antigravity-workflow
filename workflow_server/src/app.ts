import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authRouter } from './modules/auth/auth.routes.js';
import { userRouter } from './modules/users/users.routes.js';
import { projectRouter } from './modules/projects/projects.routes.js';
import { issueRouter } from './modules/issues/issues.routes.js';
import { commentRouter } from './modules/comments/comments.routes.js';
import { sprintRouter } from './modules/sprints/sprints.routes.js';
import { customFieldRouter } from './modules/customFields/customFields.routes.js';
import { attachmentRouter } from './modules/attachments/attachments.routes.js';
import { linkPreviewRouter } from './modules/linkPreviews/linkPreviews.routes.js';
import { worklogRouter } from './modules/worklogs/worklogs.routes.js';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 🛡️ JSON Syntax Error 안전 처리 미들웨어
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    return res.status(400).json({ error: 'Invalid JSON payload format' });
  }
  next(err);
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth & Modular REST API Routers
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/projects', projectRouter);
app.use('/api/issues', issueRouter);
app.use('/api/comments', commentRouter);
app.use('/api/sprints', sprintRouter);
app.use('/api/custom-fields', customFieldRouter);
app.use('/api/attachments', attachmentRouter);
app.use('/api/link-previews', linkPreviewRouter);
app.use('/api/worklogs', worklogRouter);
