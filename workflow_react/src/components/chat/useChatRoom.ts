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
import {
  useChatSocketEvents,
  processChatFiles,
  buildMentionSuggestions,
  matchesChannelCategory,
} from './useChatSocketEvents';

export interface UseChatRoomProps {
  propChannelId?: number | null;
  onSelectChannel?: (channelId: number) => void;
  onOpenAuth?: () => void;
}

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
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(() => propChannelId ?? wsChannelId ?? null);
  const [activeCategory, setActiveCategory] = useState<ChannelType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<ChannelType, boolean>>({
    GLOBAL: false, GENERAL: false, PROJECT: false, GROUP: false, DM: false,
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
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  // Channel Create Modal state (exposed to parent view)
  const [createDialogVisible, setShowCreateModal] = useState<boolean>(false);
  const [createModalType, setCreateModalType] = useState<ChannelType>('GENERAL');

  // 1. Fetch Channels
  const fetchChannels = useCallback(async () => {
    try {
      const data = await getChannels();
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
      setMessages(rawList.map((m: any) => ({ ...m, reactions: groupReactions(m.reactions, currentUserId) })));
      useChatStore.getState().markChannelAsRead(channelId);
      await markAsRead(channelId);
      setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c)));
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
  useChatSocketEvents({ token, selectedChannelId, currentUserId, setMessages, setChannels, setTypingUsers });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChannel = useCallback((cId: number) => {
    if (cId === selectedChannelId) return;
    setSelectedChannelId(cId);
    setSelectedAttachments([]);
    setWsChannelId(cId);
    useChatStore.getState().setSelectedChannelId(cId);
    useChatStore.getState().markChannelAsRead(cId);
    markAsRead(cId).catch(console.error);
    setChannels((prev) => prev.map((c) => (c.id === cId ? { ...c, unreadCount: 0 } : c)));
    if (onSelectChannel) onSelectChannel(cId);
  }, [selectedChannelId, setWsChannelId, onSelectChannel]);

  const toggleCategoryCollapse = useCallback((type: ChannelType) => {
    setCollapsedCategories((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const handleSelectCategory = useCallback((cat: ChannelType | 'ALL') => {
    setActiveCategory(cat);
    if (cat !== 'ALL') {
      const currentChannel = channels.find((c) => c.id === selectedChannelId);
      if (!currentChannel || !matchesChannelCategory(currentChannel, cat)) {
        const firstInCat = channels.find((c) => matchesChannelCategory(c, cat));
        if (firstInCat) {
          setSelectedChannelId(firstInCat.id);
          setWsChannelId(firstInCat.id);
          useChatStore.getState().setSelectedChannelId(firstInCat.id);
          if (onSelectChannel) onSelectChannel(firstInCat.id);
        }
      }
    }
  }, [channels, selectedChannelId, setWsChannelId, onSelectChannel]);

  const handleOpenCreateForCategory = useCallback((type: ChannelType, e: React.MouseEvent) => {
    e.stopPropagation();
    setCreateModalType(type);
    setShowCreateModal(true);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setCreateModalType('GENERAL');
    setShowCreateModal(true);
  }, []);

  const handleFilesSelected = useCallback(async (files: FileList | File[]) => {
    await processChatFiles(files, showToast, (att) => setSelectedAttachments((prev) => [...prev, att]));
  }, [showToast]);

  const handleRemoveAttachment = useCallback((index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAttachments = useCallback(() => setSelectedAttachments([]), []);

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
    getSocket().emit('chat:stop_typing', { channelId: selectedChannelId });

    try {
      const savedMsg = await sendMessage(selectedChannelId, { content, attachments: currentAtts });
      if (savedMsg) {
        setMessages((prev) => (prev.some((m) => m.id === savedMsg.id) ? prev : [...prev, savedMsg]));
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
      if (!isSendingMessage) handleSendMessage();
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
    setMentionQuery(lastWord.startsWith('@') ? lastWord.slice(1) : null);
  }, [selectedChannelId, inputText, isSendingMessage, handleSendMessage]);

  const handleSelectMention = useCallback((item: { id: string | number; name: string; type: string }) => {
    setInputText((prev) => (prev.split(/@(\S*)$/)[0] || '') + `@${item.name} `);
    setMentionQuery(null);
  }, []);

  const handleToggleReaction = useCallback(async (messageId: number, emoji: string) => {
    if (!selectedChannelId) return;
    try {
      const res = await toggleReaction(messageId, emoji);
      if (res && Array.isArray(res.reactions)) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: groupReactions(res.reactions, currentUserId) } : m))
        );
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  }, [selectedChannelId, currentUserId]);

  const handleTogglePin = useCallback(async (messageId: number, currentPinned: boolean = false) => {
    if (!selectedChannelId) return;
    getSocket().emit('chat:pin_message', { channelId: selectedChannelId, messageId, isPinned: !currentPinned });
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isPinned: !currentPinned } : m)));
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

  const currentChannel = useMemo(() => channels.find((c) => c.id === selectedChannelId) || null, [channels, selectedChannelId]);
  const displayMessages = useMemo(() => (showPinnedOnly ? messages.filter((m) => m.isPinned) : messages), [messages, showPinnedOnly]);
  const mentionSuggestions = useMemo(() => buildMentionSuggestions(mentionQuery, allWorkspaceUsers, currentUserId), [mentionQuery, allWorkspaceUsers, currentUserId]);

  return {
    user, isAuthenticated, currentUserId,
    allWorkspaceUsers, allWorkspaceProjects, allWorkspaceGroups,
    channels, selectedChannelId, setSelectedChannelId,
    activeCategory, setActiveCategory: handleSelectCategory,
    searchQuery, setSearchQuery, collapsedCategories, toggleCategoryCollapse,
    showCreateModal: createDialogVisible, setShowCreateModal, createModalType,
    handleOpenCreateModal, handleOpenCreateForCategory,
    fetchChannels, currentChannel, displayMessages, loadingMessages, isSendingMessage,
    inputText, setInputText, selectedAttachments, setSelectedAttachments,
    handleFilesSelected, handleRemoveAttachment, clearAttachments,
    showPinnedOnly, setShowPinnedOnly, showNotificationMenu, setShowNotificationMenu,
    showMemberSidebar, setShowMemberSidebar, showEmojiPickerForMsgId, setShowEmojiPickerForMsgId,
    typingUsers, messagesEndRef,
    handleSelectChannel, handleSendMessage, handleKeyDown,
    handleToggleReaction, handleTogglePin, handleReplyToMessage,
    handleSetNotificationLevel, handleMarkAllAsRead,
    mentionSuggestions, mentionQuery, setMentionQuery, handleSelectMention, setWsChannelId,
  };
};
