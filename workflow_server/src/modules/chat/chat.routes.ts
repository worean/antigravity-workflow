// -*- coding: utf-8 -*-
import { Router } from 'express';
import * as chatController from './chat.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const chatRouter = Router();

// 1. 채널 목록 조회 및 채널 생성
chatRouter.get('/channels', requireAuth, chatController.getChannels);
chatRouter.post('/channels', requireAuth, chatController.createChannel);

// 2. 채널별 메시지 조회 및 메시지 전송
chatRouter.get('/channels/:channelId/messages', requireAuth, chatController.getMessages);
chatRouter.post('/channels/:channelId/messages', requireAuth, chatController.sendMessage);

// 3. 채널 읽음 처리 및 알림 설정
chatRouter.post('/channels/:channelId/read', requireAuth, chatController.markAsRead);
chatRouter.put('/channels/:channelId/settings', requireAuth, chatController.updateMemberSettings);

// 4. 이모지 리액션 토글
chatRouter.post('/messages/:messageId/reactions', requireAuth, chatController.toggleReaction);