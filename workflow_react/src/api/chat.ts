// -*- coding: utf-8 -*-
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { ChatChannel, ChatMessage, ChannelType, NotificationLevel } from '../types';

// ----------------------------------------------------
// 1. Raw API Functions
// ----------------------------------------------------

export const getChannels = async (): Promise<ChatChannel[]> => {
  const res = await apiClient.get('/chat/channels');
  return res.data;
};

export interface CreateChannelParams {
  name?: string;
  type: ChannelType;
  topic?: string;
  icon?: string;
  projectId?: number;
  groupId?: number;
  targetUserId?: number;
}

export const createChannel = async (data: CreateChannelParams): Promise<ChatChannel> => {
  const res = await apiClient.post('/chat/channels', data);
  return res.data;
};

export const getMessages = async (
  channelId: number,
  params?: { cursor?: number; limit?: number; before?: number }
): Promise<{ channelId: number; messages: ChatMessage[]; hasMore: boolean; nextCursor: number | null }> => {
  const res = await apiClient.get(`/chat/channels/${channelId}/messages`, { params });
  return res.data;
};

export const sendMessage = async (
  channelId: number,
  data: { content: string; attachments?: any[] }
): Promise<ChatMessage> => {
  const res = await apiClient.post(`/chat/channels/${channelId}/messages`, data);
  return res.data;
};

export const markAsRead = async (channelId: number): Promise<{ success: boolean; channelId: number }> => {
  const res = await apiClient.post(`/chat/channels/${channelId}/read`);
  return res.data;
};

export const updateMemberSettings = async (
  channelId: number,
  data: { notificationLevel?: NotificationLevel; mutedUntil?: string | null }
): Promise<{ channelId: number; notificationLevel: NotificationLevel; mutedUntil?: string | null }> => {
  const res = await apiClient.put(`/chat/channels/${channelId}/settings`, data);
  return res.data;
};

export const toggleReaction = async (
  messageId: number,
  emoji: string
): Promise<{ messageId: number; channelId: number; emoji: string; action: 'ADDED' | 'REMOVED'; reactions: any[] }> => {
  const res = await apiClient.post(`/chat/messages/${messageId}/reactions`, { emoji });
  return res.data;
};

// ----------------------------------------------------
// 2. Query Keys
// ----------------------------------------------------
export const chatKeys = {
  all: ['chat'] as const,
  channels: () => [...chatKeys.all, 'channels'] as const,
  messages: (channelId: number) => [...chatKeys.all, 'messages', channelId] as const,
};

// ----------------------------------------------------
// 3. TanStack Query Hooks
// ----------------------------------------------------

export const useChannels = () => {
  return useQuery({
    queryKey: chatKeys.channels(),
    queryFn: getChannels,
    refetchInterval: 30000, // 30초 주기 백그라운드 폴링 백업
  });
};

export const useChannelMessages = (channelId: number | null) => {
  return useQuery({
    queryKey: chatKeys.messages(channelId || 0),
    queryFn: () => (channelId ? getMessages(channelId) : Promise.resolve({ channelId: 0, messages: [], hasMore: false, nextCursor: null })),
    enabled: Boolean(channelId),
  });
};