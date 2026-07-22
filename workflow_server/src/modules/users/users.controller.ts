import { Request, Response } from 'express';
import { createUserService } from './services/createUser.service.js';
import { getUsersService } from './services/getUsers.service.js';
import { getUserService } from './services/getUser.service.js';
import { updateUserService } from './services/updateUser.service.js';
import { deleteUserService } from './services/deleteUser.service.js';

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await createUserService(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUsersService();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await getUserService(Number(req.params.id || req.query.id));
    res.json(user);
  } catch (error: any) {
    res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const updated = await updateUserService(Number(req.params.id || req.body.id), req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = await deleteUserService(Number(req.params.id || req.body.id));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
