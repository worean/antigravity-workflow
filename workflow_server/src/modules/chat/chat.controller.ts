// -*- coding: utf-8 -*-
import { Request, Response } from 'express';
import { getChannelsService } from './services/getChannels.service.js';
import { createChannelService } from './services/createChannel.service.js';
import { getMessagesService } from './services/getMessages.service.js';
import { sendMessageService } from './services/sendMessage.service.js';
import { markAsReadService } from './services/markAsRead.service.js';
import { updateMemberSettingsService } from './services/updateMemberSettings.service.js';
import { toggleReactionService } from './services/toggleReaction.service.js';
import { ErrorCode } from '../../common/errors/errorCode.js';

export const getChannels = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channels = await getChannelsService(req.user.id);
    res.json(channels);
  } catch (error: any) {
    res.status(500).json({ error: error.message, errorCode: ErrorCode.INTERNAL_SERVER_ERROR });
  }
};

export const createChannel = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channel = await createChannelService({ ...req.body, userId: req.user.id });
    res.status(201).json(channel);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channelId = Number(req.params.channelId);
    const result = await getMessagesService(channelId, req.user.id, req.query);
    res.json(result);
  } catch (error: any) {
    const isUnauthorized = error.message.includes('Unauthorized');
    res.status(isUnauthorized ? 403 : 400).json({
      error: error.message,
      errorCode: isUnauthorized ? ErrorCode.RESTRICTED_PERMISSION : ErrorCode.INVALID_INPUT,
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channelId = Number(req.params.channelId || req.body.channelId);
    const result = await sendMessageService({
      channelId,
      senderId: req.user.id,
      content: req.body.content,
      attachments: req.body.attachments,
    });
    res.status(201).json(result);
  } catch (error: any) {
    const isUnauthorized = error.message.includes('Unauthorized');
    res.status(isUnauthorized ? 403 : 400).json({
      error: error.message,
      errorCode: isUnauthorized ? ErrorCode.RESTRICTED_PERMISSION : ErrorCode.INVALID_INPUT,
    });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channelId = Number(req.params.channelId);
    const result = await markAsReadService(channelId, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const updateMemberSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const channelId = Number(req.params.channelId);
    const result = await updateMemberSettingsService({
      channelId,
      userId: req.user.id,
      notificationLevel: req.body.notificationLevel,
      mutedUntil: req.body.mutedUntil,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};

export const toggleReaction = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized: Login required', errorCode: ErrorCode.UNAUTHORIZED });
    const messageId = Number(req.params.messageId);
    const result = await toggleReactionService(messageId, req.user.id, req.body.emoji);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message, errorCode: ErrorCode.INVALID_INPUT });
  }
};