import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { getSocket } from '@/lib/socketClient';
import type { ChatChannel, ChatMessage, ChannelType, NotificationLevel } from '@/types';

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
    refetchInterval: 15000,
  });
};

export const useChannelMessages = (channelId: number | null) => {
  return useQuery({
    queryKey: chatKeys.messages(channelId || 0),
    queryFn: () => (channelId ? getMessages(channelId) : Promise.resolve({ channelId: 0, messages: [], hasMore: false, nextCursor: null })),
    enabled: Boolean(channelId),
  });
};

/**
 * 실시간 전체 안 읽은 채팅 통계 훅 (메뉴바 배지용)
 */
export const useUnreadChatStats = () => {
  const queryClient = useQueryClient();
  const { data: channels = [], refetch } = useChannels();

  // Socket.IO 이벤트 리스너로 실시간 쿼리 무효화
  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.channels() });
    };

    socket.on('chat:new_message', handleUpdate);
    socket.on('chat:unread_cleared', handleUpdate);
    socket.on('chat:notification', handleUpdate);

    return () => {
      socket.off('chat:new_message', handleUpdate);
      socket.off('chat:unread_cleared', handleUpdate);
      socket.off('chat:notification', handleUpdate);
    };
  }, [queryClient]);

  const totalUnreadCount = channels.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const hasMentionUnread = channels.some((c) => (c.unreadCount || 0) > 0 && c.mySettings?.notificationLevel === 'MENTIONS_ONLY');

  return {
    totalUnreadCount,
    hasMentionUnread,
    channels,
    refetch,
  };
};