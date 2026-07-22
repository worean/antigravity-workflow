import { Router } from 'express';
import * as attachmentsController from './attachments.controller.js';

export const attachmentRouter = Router();

attachmentRouter.post('/create', attachmentsController.createAttachment);
attachmentRouter.post('/', attachmentsController.createAttachment);
