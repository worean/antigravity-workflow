import { Request, Response } from 'express';
import { getChannelsService } from './services/getChannels.service.js';
import { sendMessageService } from './services/sendMessage.service.js';
import { getMessagesService } from './services/getMessages.service.js';
import { markAsReadService } from './services/markAsRead.service.js';
import { createChannelService } from './services/createChannel.service.js';
import { toggleReactionService } from './services/toggleReaction.service.js';
import { updateMemberSettingsService } from './services/updateMemberSettings.service.js';
import { ErrorCode } from '../../common/errors/errorCode.js';

export const getChannels = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const currentWorkspace = req.workspace;
    const channels = await getChannelsService(req.user.id, currentWorkspace);
    res.json(channels);
  } catch (error: any) {
    res.status(500).json({ error: error.message, errorCode: ErrorCode.INTERNAL_ERROR });
  }
};

export const createChannel = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const isDM = req.body.type === 'DM';
    const workspaceId = isDM
      ? null
      : req.body.workspaceId
      ? Number(req.body.workspaceId)
      : req.workspace?.id || null;

    const channel = await createChannelService({
      ...req.body,
      workspaceId,
      userId: req.user.id,
    });
    res.status(201).json(channel);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channelId = Number(req.params.channelId);
    if (!channelId || isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID', errorCode: ErrorCode.INVALID_INPUT });
    }
    const result = await getMessagesService(channelId, req.user.id, req.query);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channelId = Number(req.params.channelId);
    if (!channelId || isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID', errorCode: ErrorCode.INVALID_INPUT });
    }
    const message = await sendMessageService({
      channelId,
      senderId: req.user.id,
      content: req.body.content,
      attachments: req.body.attachments,
    });
    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channelId = Number(req.params.channelId);
    if (!channelId || isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID', errorCode: ErrorCode.INVALID_INPUT });
    }
    const result = await markAsReadService(channelId, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const toggleReaction = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const messageId = Number(req.params.messageId);
    const { emoji } = req.body;
    if (!messageId || !emoji) {
      return res.status(400).json({ error: 'Message ID and emoji are required', errorCode: ErrorCode.INVALID_INPUT });
    }
    const result = await toggleReactionService(messageId, req.user.id, emoji);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const updateMemberSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channelId = Number(req.params.channelId);
    const { notificationLevel, mutedUntil } = req.body;
    const result = await updateMemberSettingsService({
      channelId,
      userId: req.user.id,
      notificationLevel,
      mutedUntil: mutedUntil ? new Date(mutedUntil) : null,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};
