import { Request, Response } from 'express';
import { createAttachmentService } from './services/createAttachment.service.js';

export const createAttachment = async (req: Request, res: Response) => {
  try {
    const attachment = await createAttachmentService(req.body);
    res.status(201).json(attachment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
