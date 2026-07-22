import { Request, Response } from 'express';
import { createProjectService } from './services/createProject.service.js';
import { getProjectsService } from './services/getProjects.service.js';
import { getProjectService } from './services/getProject.service.js';
import { updateProjectService } from './services/updateProject.service.js';
import { deleteProjectService } from './services/deleteProject.service.js';
import { addMemberService } from './services/addMember.service.js';

export const createProject = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required' });
    const project = await createProjectService(req.body, req.user.id);
    res.status(201).json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await getProjectsService();
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await getProjectService(Number(req.params.id || req.query.id));
    res.json(project);
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const updated = await updateProjectService(Number(req.params.id || req.body.id), req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const result = await deleteProjectService(Number(req.params.id || req.body.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { projectId, userId, role } = req.body;
    const member = await addMemberService(Number(projectId || req.params.id), Number(userId), role);
    res.status(201).json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
