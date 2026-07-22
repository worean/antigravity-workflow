import { Request, Response } from 'express';
import { createSprintService } from './services/createSprint.service.js';
import { getSprintsService } from './services/getSprints.service.js';
import { updateSprintService } from './services/updateSprint.service.js';

export const createSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await createSprintService(req.body);
    res.status(201).json(sprint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getSprints = async (req: Request, res: Response) => {
  try {
    const pId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const sprints = await getSprintsService(pId);
    res.json(sprints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSprint = async (req: Request, res: Response) => {
  try {
    const updated = await updateSprintService(Number(req.params.id || req.body.id), req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
