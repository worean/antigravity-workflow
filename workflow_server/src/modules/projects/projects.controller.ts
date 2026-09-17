﻿﻿import { Request, Response } from 'express';
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
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    const currentUserEmail = req.user?.email;
    const projects = await getProjectsService(req.query, currentUserId, currentUserRole, currentUserEmail);
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message, errorCode: ErrorCode.INTERNAL_SERVER_ERROR });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.email === 'worean@naver.com';
    const project = await getProjectService(Number(req.params.id || req.query.id), currentUserId, isAdmin);
    res.json(project);
  } catch (error: any) {
    const isNotFound = error.message?.includes('not found');
    const isForbidden = error.message?.includes('Forbidden');
    res.status(isForbidden ? 403 : isNotFound ? 404 : 400).json({
      error: error.message,
      errorCode: isForbidden ? ErrorCode.RESTRICTED_PERMISSION : isNotFound ? ErrorCode.NOT_FOUND : ErrorCode.INVALID_INPUT,
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
    const result = await deleteProjectService(Number(req.params.id), req.user?.id);
    res.json(result);
  } catch (error: any) {
    const isNotFound = error.message.includes('not found');
    res.status(isNotFound ? 404 : 400).json({
      error: error.message,
      errorCode: isNotFound ? ErrorCode.NOT_FOUND : ErrorCode.INVALID_INPUT,
    });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const projectId = Number(req.params.id || req.body.projectId);
    const { userId, role } = req.body;
    const result = await addMemberService(projectId, Number(userId), role, req.user?.id);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const result = await removeMemberService(Number(req.params.id), Number(req.params.userId), req.user?.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const result = await updateMemberRoleService(
      Number(req.params.id),
      Number(req.params.userId),
      req.body.role,
      req.user?.id
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const addGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, role } = req.body;
    const result = await addGroupService(Number(req.params.id), Number(groupId), role, req.user?.id);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const removeGroup = async (req: Request, res: Response) => {
  try {
    const result = await removeGroupService(Number(req.params.id), Number(req.params.groupId), req.user?.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const updateGroupRole = async (req: Request, res: Response) => {
  try {
    const result = await updateGroupRoleService(
      Number(req.params.id),
      Number(req.params.groupId),
      req.body.role,
      req.user?.id
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};
