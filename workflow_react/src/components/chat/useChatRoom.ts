import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  getChannels,
  getMessages,
  sendMessage,
  markAsRead,
  updateMemberSettings,
  toggleReaction,
} from '@/api/chat';
import { getSocket } from '@/lib/socketClient';
import type { ChatChannel, ChatMessage, ChannelType, NotificationLevel, User, Project, Group } from '@/types';
import { getUsers, getProjects, getGroups } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';

export interface UseChatRoomProps {
  propChannelId?: number | null;
  onSelectChannel?: (channelId: number) => void;
  onOpenAuth?: () => void;
}

export const useChatRoom = ({ propChannelId, onSelectChannel, onOpenAuth }: UseChatRoomProps) => {
  const { user, token, isAuthenticated } = useAuth();
  const { selectedChannelId: wsChannelId, setSelectedChannelId: setWsChannelId } = useWorkspace();
  const currentUserId = user?.id || 0;

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
      setChannels(data);
      if (data.length > 0) {
        setSelectedChannelId((prev) => {
          const currentTarget = prev ?? wsChannelId;
          const exists = data.some((c) => c.id === currentTarget);
          const resolvedId = exists ? (currentTarget as number) : data[0].id;
          setWsChannelId(resolvedId);
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
  }, [fetchChannels]);

  useEffect(() => {
    if (propChannelId !== undefined && propChannelId !== null) {
      setSelectedChannelId(propChannelId);
      setWsChannelId(propChannelId);
    }
  }, [propChannelId, setWsChannelId]);

  // 2. Fetch Messages
  const fetchMessages = useCallback(async (channelId: number) => {
    setLoadingMessages(true);
    try {
      const data = await getMessages(channelId);
      setMessages(Array.isArray(data) ? data : data.messages || []);
      await markAsRead(channelId);
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChannelId) {
      fetchMessages(selectedChannelId);
    } else {
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

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.channelId === selectedChannelId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        markAsRead(msg.channelId).catch(console.error);
      }
      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === msg.channelId) {
            return {
              ...c,
              lastMessage: msg,
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
          const formatted = (data.reactions || []).map((r: any) => ({
            ...r,
            hasReacted: r.hasReacted !== undefined ? r.hasReacted : r.users?.some((u: any) => u.id === currentUserId),
          }));
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

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:reaction_updated', handleReactionUpdated);
    socket.on('chat:message_reaction', handleReactionUpdated);
    socket.on('chat:message_pinned', handleMessagePinned);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stop_typing', handleStopTyping);

    return () => {
      if (selectedChannelId) {
        socket.emit('chat:leave_channel', { channelId: selectedChannelId });
      }
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:reaction_updated', handleReactionUpdated);
      socket.off('chat:message_reaction', handleReactionUpdated);
      socket.off('chat:message_pinned', handleMessagePinned);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stop_typing', handleStopTyping);
    };
  }, [token, selectedChannelId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Stable Callbacks
  const handleSelectChannel = useCallback(
    (cId: number) => {
      if (cId === selectedChannelId) return;
      setSelectedChannelId(cId);
      setWsChannelId(cId);
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

  const handleOpenCreateForCategory = useCallback((type: ChannelType, e: React.MouseEvent) => {
    e.stopPropagation();
    setCreateModalType(type);
    setShowCreateModal(true);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setCreateModalType('GENERAL');
    setShowCreateModal(true);
  }, []);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedChannelId || isSendingMessage) return;

    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const content = inputText;
    setIsSendingMessage(true);
    setMentionQuery(null);

    const socket = getSocket();
    socket.emit('chat:stop_typing', { channelId: selectedChannelId });

    try {
      const savedMsg = await sendMessage(selectedChannelId, { content });
      if (savedMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
        setInputText('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(content);
    } finally {
      setIsSendingMessage(false);
    }
  }, [inputText, selectedChannelId, isSendingMessage, isAuthenticated, onOpenAuth]);

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
            const formatted = res.reactions.map((r: any) => ({
              ...r,
              hasReacted: r.hasReacted !== undefined ? r.hasReacted : r.users?.some((u: any) => u.id === currentUserId),
            }));
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
    setActiveCategory,
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
    mentionSuggestions,
    mentionQuery,
    setMentionQuery,
    handleSelectMention,
    setWsChannelId,
  };
};
