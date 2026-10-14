import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  getChannels,
  getMessages,
  sendMessage,
  markAsRead,
  markAllAsRead,
  updateMemberSettings,
  toggleReaction,
} from '@/api/chat';
import { getSocket } from '@/lib/socketClient';
import type { ChatChannel, ChatMessage, ChannelType, NotificationLevel, User, Project, Group, ChatAttachment } from '@/types';
import { getUsers, getProjects, getGroups } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { usePrefStore } from '@/stores/usePrefStore';
import { useChatStore } from '@/stores/useChatStore';
import { useUIStore } from '@/stores/useUIStore';
import { groupReactions } from '@/utils/reactionUtils';

export interface UseChatRoomProps {
  propChannelId?: number | null;
  onSelectChannel?: (channelId: number) => void;
  onOpenAuth?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const useChatRoom = ({ propChannelId, onSelectChannel, onOpenAuth }: UseChatRoomProps) => {
  const { user, token, isAuthenticated } = useAuth();
  const { selectedChannelId: wsChannelId, setSelectedChannelId: setWsChannelId } = useWorkspace();
  const activeWorkspaceId = usePrefStore((s) => s.activeWorkspaceId);
  const currentUserId = user?.id || 0;
  const showToast = useUIStore((s) => s.showToast);

  // Workspace Metadata
  const [allWorkspaceUsers, setAllWorkspaceUsers] = useState<User[]>([]);
  const [allWorkspaceProjects, setAllWorkspaceProjects] = useState<Project[]>([]);
  const [allWorkspaceGroups, setAllWorkspaceGroups] = useState<Group[]>([]);

  // Channels
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(() => {
    return propChannelId ?? wsChannelId ?? null;
  });
  const [activeCategory, setActiveCategory] = useState<ChannelType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<ChannelType, boolean>>({
    GLOBAL: false,
    GENERAL: false,
    PROJECT: false,
    GROUP: false,
    DM: false,
  });

  // Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [selectedAttachments, setSelectedAttachments] = useState<ChatAttachment[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const typingTimeoutRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filters & Layout Toggles
  const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState<boolean>(false);
  const [showMemberSidebar, setShowMemberSidebar] = useState<boolean>(true);
  const [showEmojiPickerForMsgId, setShowEmojiPickerForMsgId] = useState<number | null>(null);

  // Mention Autocomplete
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  // Channel Create Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createModalType, setCreateModalType] = useState<ChannelType>('GENERAL');

  // 1. Fetch Channels
  const fetchChannels = useCallback(async () => {
    try {
      const data = await getChannels();
      // 중복 채널 방어 (고유 ID 기준 고유화)
      const uniqueChannels = Array.from(new Map(data.map((c) => [c.id, c])).values());
      setChannels(uniqueChannels);
      useChatStore.getState().syncChannels(uniqueChannels);
      if (uniqueChannels.length > 0) {
        setSelectedChannelId((prev) => {
          const currentTarget = prev ?? wsChannelId;
          const exists = uniqueChannels.some((c) => c.id === currentTarget);
          const resolvedId = exists ? (currentTarget as number) : uniqueChannels[0].id;
          setWsChannelId(resolvedId);
          useChatStore.getState().setSelectedChannelId(resolvedId);
          return resolvedId;
        });
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  }, [wsChannelId, setWsChannelId]);

  useEffect(() => {
    fetchChannels();
    getUsers().then(setAllWorkspaceUsers).catch(console.error);
    getProjects().then(setAllWorkspaceProjects).catch(console.error);
    getGroups(false).then(setAllWorkspaceGroups).catch(console.error);
  }, [fetchChannels, activeWorkspaceId]);

  useEffect(() => {
    if (propChannelId !== undefined && propChannelId !== null) {
      setSelectedChannelId(propChannelId);
      setWsChannelId(propChannelId);
      useChatStore.getState().setSelectedChannelId(propChannelId);
    }
  }, [propChannelId, setWsChannelId]);

  // 2. Fetch Messages
  const fetchMessages = useCallback(async (channelId: number) => {
    setLoadingMessages(true);
    try {
      const data = await getMessages(channelId);
      const rawList = Array.isArray(data) ? data : data.messages || [];
      const normalized = rawList.map((m: any) => ({
        ...m,
        reactions: groupReactions(m.reactions, currentUserId),
      }));
      setMessages(normalized);
      useChatStore.getState().markChannelAsRead(channelId);
      await markAsRead(channelId);
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedChannelId) {
      useChatStore.getState().setSelectedChannelId(selectedChannelId);
      useChatStore.getState().markChannelAsRead(selectedChannelId);
      fetchMessages(selectedChannelId);
    } else {
      useChatStore.getState().setSelectedChannelId(null);
      setMessages([]);
    }
  }, [selectedChannelId, fetchMessages]);

  // 3. Socket.io Subscriptions
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
  }, [token, selectedChannelId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChannel = useCallback(
    (cId: number) => {
      if (cId === selectedChannelId) return;
      setSelectedChannelId(cId);
      setSelectedAttachments([]);
      setWsChannelId(cId);
      useChatStore.getState().setSelectedChannelId(cId);
      useChatStore.getState().markChannelAsRead(cId);
      markAsRead(cId).catch(console.error);
      setChannels((prev) =>
        prev.map((c) => (c.id === cId ? { ...c, unreadCount: 0 } : c))
      );
      if (onSelectChannel) onSelectChannel(cId);
    },
    [selectedChannelId, setWsChannelId, onSelectChannel]
  );

  const toggleCategoryCollapse = useCallback((type: ChannelType) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const handleSelectCategory = useCallback(
    (cat: ChannelType | 'ALL') => {
      setActiveCategory(cat);
      if (cat !== 'ALL') {
        const matchesCategory = (c: ChatChannel) => {
          if (cat === 'GLOBAL') return c.type === 'GLOBAL' || c.type === 'GENERAL';
          return c.type === cat;
        };
        const currentChannel = channels.find((c) => c.id === selectedChannelId);
        if (!currentChannel || !matchesCategory(currentChannel)) {
          const firstInCat = channels.find(matchesCategory);
          if (firstInCat) {
            setSelectedChannelId(firstInCat.id);
            setWsChannelId(firstInCat.id);
            useChatStore.getState().setSelectedChannelId(firstInCat.id);
            if (onSelectChannel) onSelectChannel(firstInCat.id);
          }
        }
      }
    },
    [channels, selectedChannelId, setWsChannelId, onSelectChannel]
  );


  const handleOpenCreateForCategory = useCallback((type: ChannelType, e: React.MouseEvent) => {
    e.stopPropagation();
    setCreateModalType(type);
    setShowCreateModal(true);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setCreateModalType('GENERAL');
    setShowCreateModal(true);
  }, []);

  const handleFilesSelected = useCallback(
    async (files: FileList | File[]) => {
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

          setSelectedAttachments((prev) => [
            ...prev,
            {
              fileName: file.name,
              fileSize: file.size,
              fileUrl: dataUrl,
              fileType: file.type || 'application/octet-stream',
            },
          ]);
        } catch (err) {
          console.error('Failed to read file as data url:', err);
          showToast(`파일을 읽는 중 오류가 발생했습니다: ${file.name}`, 'error');
        }
      }
    },
    [showToast]
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAttachments = useCallback(() => {
    setSelectedAttachments([]);
  }, []);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const hasText = !!inputText.trim();
    const hasAtts = selectedAttachments.length > 0;
    if ((!hasText && !hasAtts) || !selectedChannelId || isSendingMessage) return;

    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const content = inputText;
    const currentAtts = [...selectedAttachments];
    setIsSendingMessage(true);
    setMentionQuery(null);

    const socket = getSocket();
    socket.emit('chat:stop_typing', { channelId: selectedChannelId });

    try {
      const savedMsg = await sendMessage(selectedChannelId, { content, attachments: currentAtts });
      if (savedMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
        setInputText('');
        setSelectedAttachments([]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(content);
      setSelectedAttachments(currentAtts);
    } finally {
      setIsSendingMessage(false);
    }
  }, [inputText, selectedAttachments, selectedChannelId, isSendingMessage, isAuthenticated, onOpenAuth]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSendingMessage) {
        handleSendMessage();
      }
      return;
    }

    if (selectedChannelId) {
      const socket = getSocket();
      socket.emit('chat:typing', { channelId: selectedChannelId });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:stop_typing', { channelId: selectedChannelId });
      }, 2000);
    }

    const textBeforeCursor = inputText.slice(0, e.currentTarget.selectionStart);
    const lastWord = textBeforeCursor.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.slice(1));
    } else {
      setMentionQuery(null);
    }
  }, [selectedChannelId, inputText, isSendingMessage, handleSendMessage]);

  const handleSelectMention = useCallback((item: { id: string | number; name: string; type: string }) => {
    const mentionTag = `@${item.name} `;
    setInputText((prev) => {
      const parts = prev.split(/@(\S*)$/);
      return (parts[0] || '') + mentionTag;
    });
    setMentionQuery(null);
  }, []);

  const handleToggleReaction = useCallback(async (messageId: number, emoji: string) => {
    if (!selectedChannelId) return;
    try {
      const res = await toggleReaction(messageId, emoji);
      if (res && Array.isArray(res.reactions)) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const formatted = groupReactions(res.reactions, currentUserId);
            return { ...m, reactions: formatted };
          })
        );
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  }, [selectedChannelId, currentUserId]);

  const handleTogglePin = useCallback(async (messageId: number, currentPinned: boolean = false) => {
    if (!selectedChannelId) return;
    const socket = getSocket();
    socket.emit('chat:pin_message', {
      channelId: selectedChannelId,
      messageId,
      isPinned: !currentPinned,
    });

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isPinned: !currentPinned } : m))
    );
  }, [selectedChannelId]);

  const handleReplyToMessage = useCallback((msg: ChatMessage) => {
    setInputText(`> ${msg.sender?.name || 'User'}: ${msg.content.slice(0, 40)}...\n@${msg.sender?.name || 'User'} `);
  }, []);

  const handleSetNotificationLevel = useCallback(async (level: NotificationLevel) => {
    if (!selectedChannelId) return;
    try {
      await updateMemberSettings(selectedChannelId, { notificationLevel: level });
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === selectedChannelId) {
            const currentMem = c.members?.find((m) => m.userId === currentUserId);
            if (currentMem) currentMem.notificationLevel = level;
          }
          return c;
        })
      );
      setShowNotificationMenu(false);
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  }, [selectedChannelId, currentUserId]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      useChatStore.getState().markAllAsRead();
      setChannels((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const currentChannel = useMemo(() => {
    return channels.find((c) => c.id === selectedChannelId) || null;
  }, [channels, selectedChannelId]);

  const displayMessages = useMemo(() => {
    if (showPinnedOnly) {
      return messages.filter((m) => m.isPinned);
    }
    return messages;
  }, [messages, showPinnedOnly]);

  const mentionSuggestions = useMemo(() => {
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
  }, [mentionQuery, allWorkspaceUsers, currentUserId]);

  return {
    user,
    isAuthenticated,
    currentUserId,
    allWorkspaceUsers,
    allWorkspaceProjects,
    allWorkspaceGroups,
    channels,
    selectedChannelId,
    setSelectedChannelId,
    activeCategory,
    setActiveCategory: handleSelectCategory,
    searchQuery,
    setSearchQuery,
    collapsedCategories,
    toggleCategoryCollapse,
    showCreateModal,
    setShowCreateModal,
    createModalType,
    handleOpenCreateModal,
    handleOpenCreateForCategory,
    fetchChannels,
    currentChannel,
    displayMessages,
    loadingMessages,
    isSendingMessage,
    inputText,
    setInputText,
    selectedAttachments,
    setSelectedAttachments,
    handleFilesSelected,
    handleRemoveAttachment,
    clearAttachments,
    showPinnedOnly,
    setShowPinnedOnly,
    showNotificationMenu,
    setShowNotificationMenu,
    showMemberSidebar,
    setShowMemberSidebar,
    showEmojiPickerForMsgId,
    setShowEmojiPickerForMsgId,
    typingUsers,
    messagesEndRef,
    handleSelectChannel,
    handleSendMessage,
    handleKeyDown,
    handleToggleReaction,
    handleTogglePin,
    handleReplyToMessage,
    handleSetNotificationLevel,
    handleMarkAllAsRead,
    mentionSuggestions,
    mentionQuery,
    setMentionQuery,
    handleSelectMention,
    setWsChannelId,
  };
};
