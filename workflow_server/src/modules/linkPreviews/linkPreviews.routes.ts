import { Router } from 'express';
import * as linkPreviewsController from './linkPreviews.controller.js';

export const linkPreviewRouter = Router();

linkPreviewRouter.get('/get', linkPreviewsController.getLinkPreview);
linkPreviewRouter.get('/', linkPreviewsController.getLinkPreview);
linkPreviewRouter.post('/save', linkPreviewsController.saveLinkPreview);
