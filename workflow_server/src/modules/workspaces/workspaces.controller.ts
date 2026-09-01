import { Request, Response } from 'express';
import { createWorkspaceService } from './services/createWorkspace.service.js';
import { getMyWorkspacesService } from './services/getMyWorkspaces.service.js';
import { getWorkspaceDetailService } from './services/getWorkspaceDetail.service.js';
import { inviteWorkspaceMemberService } from './services/inviteWorkspaceMember.service.js';
import { removeWorkspaceMemberService } from './services/removeWorkspaceMember.service.js';
import { updateWorkspaceService } from './services/updateWorkspace.service.js';
import { deleteWorkspaceService } from './services/deleteWorkspace.service.js';
import { createInvitationService } from './services/createInvitation.service.js';
import { acceptInvitationService } from './services/acceptInvitation.service.js';
import { getInvitationsService, deleteInvitationService } from './services/getInvitations.service.js';

export const createWorkspaceController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized: Login required' });

    const workspace = await createWorkspaceService(user, req.body);
    res.status(201).json(workspace);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyWorkspacesController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized: Login required' });

    const workspaces = await getMyWorkspacesService(user.id);
    res.status(200).json(workspaces);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getWorkspaceDetailController = async (req: Request, res: Response) => {
  try {
    const workspaceId = Number(req.params.id || req.workspace?.id);
    const detail = await getWorkspaceDetailService(workspaceId);
    res.status(200).json(detail);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const inviteMemberController = async (req: Request, res: Response) => {
  try {
    const workspaceId = Number(req.params.id || req.workspace?.id);
    const membership = await inviteWorkspaceMemberService({
      workspaceId,
      email: req.body.email,
      userId: req.body.userId ? Number(req.body.userId) : undefined,
      role: req.body.role,
    });
    res.status(200).json(membership);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const removeMemberController = async (req: Request, res: Response) => {
  try {
    const workspaceId = Number(req.params.id || req.workspace?.id);
    const targetUserId = Number(req.params.userId || req.body.userId);
    const result = await removeWorkspaceMemberService(workspaceId, targetUserId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateWorkspaceController = async (req: Request, res: Response) => {
  try {
    const workspaceId = Number(req.params.id || req.workspace?.id);
    const updated = await updateWorkspaceService(workspaceId, req.body);
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWorkspaceController = async (req: Request, res: Response) => {
  try {
    const workspaceId = Number(req.params.id || req.workspace?.id);
    const result = await deleteWorkspaceService(workspaceId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createInvitationController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized: Login required' });

    const workspaceId = Number(req.params.id || req.workspace?.id);
    const result = await createInvitationService({
      workspaceId,
      email: req.body.email,
      role: req.body.role,
      inviterId: user.id,
      expiresInDays: req.body.expiresInDays,
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const acceptInvitationController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized: Login required' });

    const inviteToken = req.body.token || req.body.inviteToken || (req.query.token as string);
    const result = await acceptInvitationService(inviteToken, user);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getInvitationsController = async (req: Request, res: Response) => {
  try {
    const workspaceId = Number(req.params.id || req.workspace?.id);
    const invitations = await getInvitationsService(workspaceId);
    res.status(200).json(invitations);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteInvitationController = async (req: Request, res: Response) => {
  try {
    const workspaceId = Number(req.params.id || req.workspace?.id);
    const invitationId = Number(req.params.invitationId);
    const result = await deleteInvitationService(workspaceId, invitationId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
