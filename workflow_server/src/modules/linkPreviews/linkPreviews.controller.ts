import { Request, Response } from 'express';
import { getLinkPreviewService } from './services/getLinkPreview.service.js';
import { saveLinkPreviewService } from './services/saveLinkPreview.service.js';

export const getLinkPreview = async (req: Request, res: Response) => {
  try {
    const preview = await getLinkPreviewService(String(req.query.url || req.body.url));
    res.json(preview || null);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const saveLinkPreview = async (req: Request, res: Response) => {
  try {
    const saved = await saveLinkPreviewService(req.body);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
