import { useEffect } from 'react';
import { markAsRead } from '@/api/chat';
import { getSocket } from '@/lib/socketClient';
import type { ChatChannel, ChatMessage, ChatAttachment, User, ChannelType } from '@/types';
import { useChatStore } from '@/stores/useChatStore';
import { groupReactions } from '@/utils/reactionUtils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const processChatFiles = async (
  files: FileList | File[],
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void,
  onAppendAttachment: (att: ChatAttachment) => void
) => {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) return;

  for (const file of fileArray) {
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      showToast(`첨부파일 크기는 최대 5MB를 초과할 수 없습니다. (${file.name}: ${sizeMb}MB)`, 'error');
      continue;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      onAppendAttachment({
        fileName: file.name,
        fileSize: file.size,
        fileUrl: dataUrl,
        fileType: file.type || 'application/octet-stream',
      });
    } catch (err) {
      console.error('Failed to read file as data url:', err);
      showToast(`파일을 읽는 중 오류가 발생했습니다: ${file.name}`, 'error');
    }
  }
};

export const buildMentionSuggestions = (
  mentionQuery: string | null,
  allWorkspaceUsers: User[],
  currentUserId: number
) => {
  if (mentionQuery === null) return [];
  const q = mentionQuery.toLowerCase();
  const list: { id: string | number; name: string; type: string }[] = [
    { id: 'all', name: 'all (전체 알림)', type: 'special' },
  ];
  allWorkspaceUsers.forEach((u) => {
    if (u.id !== currentUserId && (u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) {
      list.push({ id: u.id, name: u.name || u.email, type: 'user' });
    }
  });
  return list;
};

export const matchesChannelCategory = (c: ChatChannel, cat: ChannelType | 'ALL'): boolean => {
  if (cat === 'ALL') return true;
  if (cat === 'GLOBAL') return c.type === 'GLOBAL' || c.type === 'GENERAL';
  return c.type === cat;
};

export interface UseChatSocketEventsParams {
  token: string | null;
  selectedChannelId: number | null;
  currentUserId: number;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setChannels: React.Dispatch<React.SetStateAction<ChatChannel[]>>;
  setTypingUsers: React.Dispatch<React.SetStateAction<Map<number, string>>>;
}

export const useChatSocketEvents = ({
  token,
  selectedChannelId,
  currentUserId,
  setMessages,
  setChannels,
  setTypingUsers,
}: UseChatSocketEventsParams) => {
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();

    if (selectedChannelId) {
      socket.emit('chat:join_channel', { channelId: selectedChannelId });
    }

    const handleNewMessage = (msg: any) => {
      const realMsg: ChatMessage = msg?.message || msg;
      const targetChannelId = Number(msg?.channelId || realMsg?.channelId);
      const hasMention = !!(realMsg?.hasMention || msg?.hasMention);

      if (targetChannelId === selectedChannelId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === realMsg.id)) return prev;
          return [...prev, realMsg];
        });
        markAsRead(targetChannelId).catch(console.error);
        useChatStore.getState().markChannelAsRead(targetChannelId);
      } else {
        useChatStore.getState().onNewMessageReceived(targetChannelId, hasMention);
      }

      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === targetChannelId) {
            return {
              ...c,
              lastMessage: realMsg,
              unreadCount: c.id === selectedChannelId ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    };

    const handleReactionUpdated = (data: { messageId: number; reactions: any[] }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          const formatted = groupReactions(data.reactions, currentUserId);
          return { ...m, reactions: formatted };
        })
      );
    };

    const handleMessagePinned = (data: { messageId: number; isPinned: boolean }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, isPinned: data.isPinned } : m))
      );
    };

    const handleTyping = (data: { channelId: number; userId: number; userName: string }) => {
      if (data.channelId === selectedChannelId && data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.userName);
          return next;
        });
      }
    };

    const handleStopTyping = (data: { channelId: number; userId: number }) => {
      if (data.channelId === selectedChannelId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    const handleChannelRead = (data: { channelId: number }) => {
      useChatStore.getState().markChannelAsRead(data.channelId);
      setChannels((prev) =>
        prev.map((c) => (c.id === data.channelId ? { ...c, unreadCount: 0 } : c))
      );
    };

    const handleAllRead = () => {
      useChatStore.getState().markAllAsRead();
      setChannels((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
    };

    const handleUserUpdated = (updatedUser: any) => {
      if (!updatedUser?.userId && !updatedUser?.email) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (
            msg.senderId === updatedUser.userId ||
            msg.sender?.email === updatedUser.email
          ) {
            return {
              ...msg,
              sender: {
                ...msg.sender,
                ...updatedUser,
              },
            };
          }
          return msg;
        })
      );
      setChannels((prev) =>
        prev.map((c) => ({
          ...c,
          members: c.members?.map((m: any) => {
            if (
              m.userId === updatedUser.userId ||
              m.email === updatedUser.email ||
              m.user?.email === updatedUser.email
            ) {
              return {
                ...m,
                user: { ...(m.user || {}), ...updatedUser },
                avatar: updatedUser.avatar,
                avatarColor: updatedUser.avatarColor,
              };
            }
            return m;
          }),
        }))
      );
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('new_message', handleNewMessage);
    socket.on('chat:reaction_updated', handleReactionUpdated);
    socket.on('reaction_updated', handleReactionUpdated);
    socket.on('chat:message_reaction', handleReactionUpdated);
    socket.on('chat:message_pinned', handleMessagePinned);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stop_typing', handleStopTyping);
    socket.on('channel_read', handleChannelRead);
    socket.on('chat:all_read', handleAllRead);
    socket.on('chat:user_updated', handleUserUpdated);

    return () => {
      if (selectedChannelId) {
        socket.emit('chat:leave_channel', { channelId: selectedChannelId });
      }
      socket.off('chat:new_message', handleNewMessage);
      socket.off('new_message', handleNewMessage);
      socket.off('chat:reaction_updated', handleReactionUpdated);
      socket.off('reaction_updated', handleReactionUpdated);
      socket.off('chat:message_reaction', handleReactionUpdated);
      socket.off('chat:message_pinned', handleMessagePinned);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stop_typing', handleStopTyping);
      socket.off('channel_read', handleChannelRead);
      socket.off('chat:all_read', handleAllRead);
      socket.off('chat:user_updated', handleUserUpdated);
    };
  }, [token, selectedChannelId, currentUserId, setMessages, setChannels, setTypingUsers]);
};
