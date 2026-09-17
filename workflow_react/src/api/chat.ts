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
  workspaceId?: number;
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
): Promise<{ messageId: number; reactions: { emoji: string; count: number; users: { id: number; name: string }[] }[] }> => {
  const res = await apiClient.post(`/chat/messages/${messageId}/reactions`, { emoji });
  return res.data;
};

import { usePrefStore } from '@/stores/usePrefStore';

// ----------------------------------------------------
// 2. TanStack Query Hooks (with Realtime Sync)
// ----------------------------------------------------

export const useChatChannels = (options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const activeWorkspaceId = usePrefStore((s) => s.activeWorkspaceId);

  const query = useQuery({
    queryKey: ['chat', 'channels', activeWorkspaceId],
    queryFn: getChannels,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30, // 30초 캐시 (워크스페이스 전환 시 즉시 갱신)
    enabled: options?.enabled ?? true,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (payload?: any) => {
      // 다른 워크스페이스의 메시지 이벤트는 현재 워크스페이스 캐시에 영향 주지 않음
      if (payload?.workspaceId && activeWorkspaceId && payload.workspaceId !== activeWorkspaceId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['chat', 'channels', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unreadStats'] });
    };

    const handleReaction = () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'channels', activeWorkspaceId] });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('reaction_updated', handleReaction);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('reaction_updated', handleReaction);
    };
  }, [queryClient, activeWorkspaceId]);

  return query;
};

export const useUnreadChatStats = () => {
  const { data: channels = [] } = useChatChannels();

  const totalUnreadCount = channels.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const hasMentionUnread = channels.some((c) => (c.unreadCount || 0) > 0 && c.hasMention);

  return {
    totalUnreadCount,
    hasMentionUnread,
    channels,
  };
};
