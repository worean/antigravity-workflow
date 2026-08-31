// -*- coding: utf-8 -*-
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  getChannels,
  createChannel,
  getMessages,
  sendMessage,
  markAsRead,
  updateMemberSettings,
  toggleReaction,
  type CreateChannelParams,
} from '@/api/chat';
import { getSocket } from '@/lib/socketClient';
import type { ChatChannel, ChatMessage, ChannelType, NotificationLevel, User, Project, Group } from '@/types';
import { getUsers, getProjects, getGroups } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  ChatCategoryNav,
  ChatChannelSidebar,
  ChatMainArea,
  ChatMemberSidebar,
  ChatCreateModal,
} from '@/components/chat';

interface ChatPageProps {
  selectedChannelId?: number | null;
  onSelectChannel?: (channelId: number) => void;
  onOpenAuth?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  selectedChannelId: propChannelId,
  onSelectChannel,
  onOpenAuth,
}) => {
  const { user, token, isAuthenticated } = useAuth();
  const currentUserId = user?.id || 0;

  // Workspace Metadata
  const [allWorkspaceUsers, setAllWorkspaceUsers] = useState<User[]>([]);
  const [allWorkspaceProjects, setAllWorkspaceProjects] = useState<Project[]>([]);
  const [allWorkspaceGroups, setAllWorkspaceGroups] = useState<Group[]>([]);

  // Channels
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(propChannelId || null);
  const [activeCategory, setActiveCategory] = useState<ChannelType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<ChannelType, boolean>>({
    GLOBAL: false,
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
  const [createType, setCreateType] = useState<ChannelType>('GLOBAL');
  const [createName, setCreateName] = useState<string>('');
  const [createTopic, setCreateTopic] = useState<string>('');
  const [createTargetUserId, setCreateTargetUserId] = useState<number | null>(null);
  const [createProjectId, setCreateProjectId] = useState<number | null>(null);
  const [createGroupId, setCreateGroupId] = useState<number | null>(null);

  // 1. Fetch Channels
  const fetchChannels = async () => {
    try {
      const data = await getChannels();
      setChannels(data);
      if (!selectedChannelId && data.length > 0) {
        setSelectedChannelId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  };

  useEffect(() => {
    fetchChannels();
    getUsers().then(setAllWorkspaceUsers).catch(console.error);
    getProjects().then(setAllWorkspaceProjects).catch(console.error);
    getGroups(false).then(setAllWorkspaceGroups).catch(console.error);
  }, []);

  useEffect(() => {
    if (propChannelId !== undefined) {
      setSelectedChannelId(propChannelId);
    }
  }, [propChannelId]);

  // 2. Fetch Messages
  const fetchMessages = async (channelId: number) => {
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
  };

  useEffect(() => {
    if (selectedChannelId) {
      fetchMessages(selectedChannelId);
    } else {
      setMessages([]);
    }
  }, [selectedChannelId]);

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

    const handleMessageReaction = (data: { messageId: number; reactions: any[] }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
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
    socket.on('chat:message_reaction', handleMessageReaction);
    socket.on('chat:message_pinned', handleMessagePinned);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stop_typing', handleStopTyping);

    return () => {
      if (selectedChannelId) {
        socket.emit('chat:leave_channel', { channelId: selectedChannelId });
      }
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:message_reaction', handleMessageReaction);
      socket.off('chat:message_pinned', handleMessagePinned);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stop_typing', handleStopTyping);
    };
  }, [token, selectedChannelId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
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
      // 실패 시 입력 내용 복원
      setInputText(content);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
  };

  const handleSelectMention = (item: { id: string | number; name: string; type: string }) => {
    const mentionTag = `@${item.name} `;
    setInputText((prev) => {
      const parts = prev.split(/@(\S*)$/);
      return (parts[0] || '') + mentionTag;
    });
    setMentionQuery(null);
  };

  const handleToggleReaction = async (messageId: number, emoji: string) => {
    if (!selectedChannelId) return;
    try {
      await toggleReaction(messageId, emoji);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const handleTogglePin = async (messageId: number, currentPinned: boolean = false) => {
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
  };

  const handleReplyToMessage = (msg: ChatMessage) => {
    setInputText(`> ${msg.sender?.name || 'User'}: ${msg.content.slice(0, 40)}...\n@${msg.sender?.name || 'User'} `);
  };

  const handleSetNotificationLevel = async (level: NotificationLevel) => {
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
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params: CreateChannelParams = {
        type: createType,
        name: createName.trim() || undefined,
        topic: createTopic.trim() || undefined,
        targetUserId: createType === 'DM' ? createTargetUserId || undefined : undefined,
        projectId: createType === 'PROJECT' ? createProjectId || undefined : undefined,
        groupId: createType === 'GROUP' ? createGroupId || undefined : undefined,
      };

      const newChan = await createChannel(params);
      setShowCreateModal(false);
      setCreateName('');
      setCreateTopic('');
      setCreateTargetUserId(null);

      await fetchChannels();
      setSelectedChannelId(newChan.id);
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  const toggleCategoryCollapse = (type: ChannelType) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleOpenCreateForCategory = (type: ChannelType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setCreateType(type);
    if (type === 'PROJECT' && allWorkspaceProjects.length > 0) {
      setCreateProjectId(allWorkspaceProjects[0].id);
      setCreateName(allWorkspaceProjects[0].name);
    } else if (type === 'GROUP' && allWorkspaceGroups.length > 0) {
      setCreateGroupId(allWorkspaceGroups[0].id);
      setCreateName(allWorkspaceGroups[0].name);
    } else {
      setCreateName('');
    }
    setShowCreateModal(true);
  };

  const currentChannel = channels.find((c) => c.id === selectedChannelId) || null;

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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', height: 'calc(100vh - 56px)', background: '#1e1e1e', color: '#dcddde', overflow: 'hidden' }}>
      {/* 1. Category Nav (60px) */}
      <ChatCategoryNav
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        isAuthenticated={isAuthenticated}
        onOpenCreateModal={() => {
          setCreateType('GLOBAL');
          setCreateName('');
          setShowCreateModal(true);
        }}
      />

      {/* 2. Channels Sidebar (240px) */}
      <ChatChannelSidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={(cId) => {
          setSelectedChannelId(cId);
          if (onSelectChannel) onSelectChannel(cId);
        }}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        collapsedCategories={collapsedCategories}
        toggleCategoryCollapse={toggleCategoryCollapse}
        handleOpenCreateForCategory={handleOpenCreateForCategory}
        fetchChannels={fetchChannels}
        onOpenAuth={onOpenAuth}
      />

      {/* 3. Main Chat Feed & Input Area */}
      <ChatMainArea
        currentChannel={currentChannel}
        showPinnedOnly={showPinnedOnly}
        setShowPinnedOnly={setShowPinnedOnly}
        showNotificationMenu={showNotificationMenu}
        setShowNotificationMenu={setShowNotificationMenu}
        showMemberSidebar={showMemberSidebar}
        setShowMemberSidebar={setShowMemberSidebar}
        handleSetNotificationLevel={handleSetNotificationLevel}
        loadingMessages={loadingMessages}
        displayMessages={displayMessages}
        currentUserId={currentUserId}
        showEmojiPickerForMsgId={showEmojiPickerForMsgId}
        setShowEmojiPickerForMsgId={setShowEmojiPickerForMsgId}
        typingUsers={typingUsers}
        messagesEndRef={messagesEndRef}
        handleToggleReaction={handleToggleReaction}
        handleTogglePin={handleTogglePin}
        handleReplyToMessage={handleReplyToMessage}
        isAuthenticated={isAuthenticated}
        isSendingMessage={isSendingMessage}
        inputText={inputText}
        setInputText={setInputText}
        handleSendMessage={handleSendMessage}
        handleKeyDown={handleKeyDown}
        mentionSuggestions={mentionSuggestions}
        mentionQuery={mentionQuery}
        handleSelectMention={handleSelectMention}
        setMentionQuery={setMentionQuery}
        onOpenAuth={onOpenAuth}
      />

      {/* 4. Member Sidebar */}
      <ChatMemberSidebar
        showMemberSidebar={showMemberSidebar}
        currentChannel={currentChannel}
        allWorkspaceUsers={allWorkspaceUsers}
      />

      {/* 5. Create Channel Modal */}
      <ChatCreateModal
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        createType={createType}
        setCreateType={setCreateType}
        createName={createName}
        setCreateName={setCreateName}
        createTopic={createTopic}
        setCreateTopic={setCreateTopic}
        createTargetUserId={createTargetUserId}
        setCreateTargetUserId={setCreateTargetUserId}
        createProjectId={createProjectId}
        setCreateProjectId={setCreateProjectId}
        createGroupId={createGroupId}
        setCreateGroupId={setCreateGroupId}
        allWorkspaceUsers={allWorkspaceUsers}
        allWorkspaceProjects={allWorkspaceProjects}
        allWorkspaceGroups={allWorkspaceGroups}
        currentUserId={currentUserId}
        handleCreateChannel={handleCreateChannel}
      />
    </div>
  );
};