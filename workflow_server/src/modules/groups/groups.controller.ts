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

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, code, description, parentId, order } = req.body;
    const group = await createGroupService({ name, code, description, parentId, order });
    res.status(201).json(group);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  try {
    const asTree = req.query.asTree === 'true' || req.query.tree === 'true';
    const groups = await getGroupsService({ asTree });
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const group = await getGroupService(id);
    res.json(group);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, code, description, parentId, order } = req.body;
    const group = await updateGroupService(id, { name, code, description, parentId, order });
    res.json(group);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await deleteGroupService(id);
    res.json({ message: 'Group successfully deleted', id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const addGroupMember = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.id || req.body.groupId);
    const { userId, role, title } = req.body;
    const membership = await addGroupMemberService({ groupId, userId: Number(userId), role, title });
    res.status(201).json(membership);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateGroupMember = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.id || req.body.groupId);
    const userId = Number(req.params.userId || req.body.userId);
    const { role, title } = req.body;
    const membership = await updateGroupMemberService({ groupId, userId, role, title });
    res.json(membership);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const removeGroupMember = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.id || req.params.groupId);
    const userId = Number(req.params.userId);
    await removeGroupMemberService(groupId, userId);
    res.json({ message: 'Group member successfully removed', groupId, userId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

