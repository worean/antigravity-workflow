import { Request, Response } from 'express';
import { createCustomFieldService } from './services/createCustomField.service.js';
import { getCustomFieldsService } from './services/getCustomFields.service.js';

export const createCustomField = async (req: Request, res: Response) => {
  try {
    const cf = await createCustomFieldService(req.body);
    res.status(201).json(cf);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCustomFields = async (req: Request, res: Response) => {
  try {
    const fields = await getCustomFieldsService();
    res.json(fields);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
