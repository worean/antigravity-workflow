import { Request, Response } from 'express';
import { createProjectService } from './services/createProject.service.js';
import { getProjectsService } from './services/getProjects.service.js';
import { getProjectService } from './services/getProject.service.js';
import { updateProjectService } from './services/updateProject.service.js';
import { deleteProjectService } from './services/deleteProject.service.js';
import { addMemberService } from './services/addMember.service.js';
import { removeMemberService } from './services/removeMember.service.js';
import { updateMemberRoleService } from './services/updateMemberRole.service.js';
import { addGroupService } from './services/addGroup.service.js';
import { removeGroupService } from './services/removeGroup.service.js';
import { updateGroupRoleService } from './services/updateGroupRole.service.js';
import { ErrorCode } from '../../common/errors/errorCode.js';

export const createProject = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    }
    const project = await createProjectService(req.body, req.user.id);
    res.status(201).json(project);
  } catch (error: any) {
    const isDup = error.message?.includes('already exists') || error.code === 'P2002';
    res.status(400).json({
      error: error.message,
      errorCode: isDup ? ErrorCode.PROJECT_ALREADY_EXISTS : ErrorCode.INVALID_INPUT,
    });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user ? req.user.id : undefined;
    const projects = await getProjectsService(req.query, currentUserId);
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message, errorCode: ErrorCode.INTERNAL_SERVER_ERROR });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await getProjectService(Number(req.params.id || req.query.id));
    res.json(project);
  } catch (error: any) {
    const isNotFound = error.message.includes('not found');
    res.status(isNotFound ? 404 : 400).json({
      error: error.message,
      errorCode: isNotFound ? ErrorCode.NOT_FOUND : ErrorCode.INVALID_INPUT,
    });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const updated = await updateProjectService(Number(req.params.id || req.body.id), req.body, req.user?.id);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const result = await deleteProjectService(Number(req.params.id || req.body.id), req.user?.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { projectId, userId, role } = req.body;
    const pId = Number(req.params.id || projectId);
    const uId = Number(userId || req.body.memberId);
    const member = await addMemberService(pId, uId, role, req.user?.id);
    res.status(201).json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const pId = Number(req.params.id || req.body.projectId);
    const uId = Number(req.params.userId || req.body.userId);
    const result = await removeMemberService(pId, uId, req.user?.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const pId = Number(req.params.id || req.body.projectId);
    const uId = Number(req.params.userId || req.body.userId);
    const { role } = req.body;
    const member = await updateMemberRoleService(pId, uId, role, req.user?.id);
    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const addGroup = async (req: Request, res: Response) => {
  try {
    const { projectId, groupId, role } = req.body;
    const pId = Number(req.params.id || projectId);
    const gId = Number(groupId);
    const projectGroup = await addGroupService(pId, gId, role, req.user?.id);
    res.status(201).json(projectGroup);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const removeGroup = async (req: Request, res: Response) => {
  try {
    const pId = Number(req.params.id || req.body.projectId);
    const gId = Number(req.params.groupId || req.body.groupId);
    const result = await removeGroupService(pId, gId, req.user?.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const updateGroupRole = async (req: Request, res: Response) => {
  try {
    const pId = Number(req.params.id || req.body.projectId);
    const gId = Number(req.params.groupId || req.body.groupId);
    const { role } = req.body;
    const projectGroup = await updateGroupRoleService(pId, gId, role, req.user?.id);
    res.json(projectGroup);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};
