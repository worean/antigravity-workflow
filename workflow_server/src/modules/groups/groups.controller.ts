// -*- coding: utf-8 -*-
import { Request, Response } from 'express';
import { createGroupService } from './services/createGroup.service.js';
import { getGroupsService } from './services/getGroups.service.js';
import { getGroupService } from './services/getGroup.service.js';
import { updateGroupService } from './services/updateGroup.service.js';
import { deleteGroupService } from './services/deleteGroup.service.js';
import { addGroupMemberService } from './services/addGroupMember.service.js';
import { removeGroupMemberService } from './services/removeGroupMember.service.js';
import { updateGroupMemberService } from './services/updateGroupMember.service.js';

const handleServiceError = (res: Response, error: any) => {
  const msg = error.message || 'Internal server error';
  if (msg.startsWith('Forbidden')) {
    return res.status(403).json({ error: msg });
  }
  if ((msg.startsWith('Group with ID') && msg.includes('not found')) || msg === 'Group member not found') {
    return res.status(404).json({ error: msg });
  }
  return res.status(400).json({ error: msg });
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, code, description, parentId, order } = req.body;
    const group = await createGroupService({ name, code, description, parentId, order }, req.user);
    res.status(201).json(group);
  } catch (error: any) {
    handleServiceError(res, error);
  }
};

export const getGroups = async (req: Request, res: Response) => {
  try {
    const asTree = req.query.asTree === 'true' || req.query.tree === 'true';
    const groups = await getGroupsService({ asTree }, req.user);
    res.json(groups);
  } catch (error: any) {
    handleServiceError(res, error);
  }
};

export const getGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const group = await getGroupService(id, req.user);
    res.json(group);
  } catch (error: any) {
    handleServiceError(res, error);
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, code, description, parentId, order } = req.body;
    const group = await updateGroupService(id, { name, code, description, parentId, order }, req.user);
    res.json(group);
  } catch (error: any) {
    handleServiceError(res, error);
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await deleteGroupService(id, req.user);
    res.json({ message: 'Group successfully deleted', id });
  } catch (error: any) {
    handleServiceError(res, error);
  }
};

export const addGroupMember = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.id || req.body.groupId);
    const { userId, role, title } = req.body;
    const membership = await addGroupMemberService({ groupId, userId: Number(userId), role, title }, req.user);
    res.status(201).json(membership);
  } catch (error: any) {
    handleServiceError(res, error);
  }
};

export const updateGroupMember = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.id || req.body.groupId);
    const userId = Number(req.params.userId || req.body.userId);
    const { role, title } = req.body;
    const membership = await updateGroupMemberService({ groupId, userId, role, title }, req.user);
    res.json(membership);
  } catch (error: any) {
    handleServiceError(res, error);
  }
};

export const removeGroupMember = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.id || req.params.groupId);
    const userId = Number(req.params.userId);
    await removeGroupMemberService(groupId, userId, req.user);
    res.json({ message: 'Group member successfully removed', groupId, userId });
  } catch (error: any) {
    handleServiceError(res, error);
  }
};

