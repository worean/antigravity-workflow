// -*- coding: utf-8 -*-
import { Request, Response } from 'express';
import { createSprintService } from './services/createSprint.service.js';
import { getSprintsService } from './services/getSprints.service.js';
import { getSprintService } from './services/getSprint.service.js';
import { updateSprintService } from './services/updateSprint.service.js';
import { deleteSprintService } from './services/deleteSprint.service.js';
import { assignIssuesToSprintService } from './services/assignIssuesToSprint.service.js';

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
    const currentUserId = req.user ? req.user.id : undefined;
    const sprints = await getSprintsService(pId, currentUserId);
    res.json(sprints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await getSprintService(Number(req.params.id));
    res.json(sprint);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
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

export const deleteSprint = async (req: Request, res: Response) => {
  try {
    const result = await deleteSprintService(Number(req.params.id || req.body.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const assignIssuesToSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await assignIssuesToSprintService(Number(req.params.id), req.body);
    res.json(sprint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};