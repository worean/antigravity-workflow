// -*- coding: utf-8 -*-
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Users,
  FolderKanban,
  Globe,
  Bell,
  BellOff,
  AtSign,
  Pin,
  Send,
  Plus,
  Search,
  Paperclip,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  getChannels,
  createChannel,
  getMessages,
  sendMessage,
  markAsRead,
  updateMemberSettings,
  toggleReaction,
  type CreateChannelParams,
} from '../api/chat';
import { getSocket } from '../lib/socketClient';
import { Avatar, Button, Spinner, FavoriteButton } from '../components/common';
import type { ChatChannel, ChatMessage, ChannelType, NotificationLevel, User, Project, Group } from '../types';
import { getUsers, getProjects, getGroups } from '../services/api';
import { useAuth } from '../context/AuthContext';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🎉', '🚀', '👀', '😄', '💯'];

interface CategoryConfig {
  type: ChannelType;
  label: string;
  icon: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  { type: 'GLOBAL', label: '공용 채널', icon: '📢' },
  { type: 'PROJECT', label: '프로젝트 채널', icon: '📁' },
  { type: 'GROUP', label: '그룹 / 부서 채널', icon: '👥' },
  { type: 'DM', label: '다이렉트 메시지', icon: '💬' },
];

interface ChatPageProps {
  onOpenAuth?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onOpenAuth }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const currentUserId = authUser?.id || 0;

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'GLOBAL' | 'PROJECT' | 'GROUP' | 'DM'>('ALL');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<ChannelType, boolean>>({
    GLOBAL: false,
    PROJECT: false,
    GROUP: false,
    DM: false,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const [showMemberSidebar, setShowMemberSidebar] = useState<boolean>(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEmojiPickerForMsgId, setShowEmojiPickerForMsgId] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [allWorkspaceUsers, setAllWorkspaceUsers] = useState<User[]>([]);
  const [allWorkspaceProjects, setAllWorkspaceProjects] = useState<Project[]>([]);
  const [allWorkspaceGroups, setAllWorkspaceGroups] = useState<Group[]>([]);

  const [createType, setCreateType] = useState<ChannelType>('GLOBAL');
  const [createName, setCreateName] = useState<string>('');
  const [createTopic, setCreateTopic] = useState<string>('');
  const [createTargetUserId, setCreateTargetUserId] = useState<number | null>(null);
  const [createProjectId, setCreateProjectId] = useState<number | null>(null);
  const [createGroupId, setCreateGroupId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const fetchChannels = async () => {
    try {
      const data = await getChannels();
      setChannels(data);
      if (data.length > 0 && !selectedChannelId) {
        setSelectedChannelId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load chat channels:', err);
    }
  };

  useEffect(() => {
    fetchChannels();
    getUsers().then(setAllWorkspaceUsers).catch(console.error);
    getProjects().then((projs) => {
      setAllWorkspaceProjects(projs);
      if (projs.length > 0) setCreateProjectId(projs[0].id);
    }).catch(console.error);
    getGroups(false).then((grps) => {
      setAllWorkspaceGroups(grps);
      if (grps.length > 0) setCreateGroupId(grps[0].id);
    }).catch(console.error);
  }, []);

  const currentChannel = useMemo(() => {
    return channels.find((c) => c.id === selectedChannelId) || null;
  }, [channels, selectedChannelId]);

  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (newMsg: ChatMessage) => {
      if (newMsg.channelId === selectedChannelId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        markAsRead(newMsg.channelId).catch(console.error);
      }

      setChannels((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.channelId) {
            return {
              ...c,
              lastMessage: {
                id: newMsg.id,
                content: newMsg.content,
                senderId: newMsg.senderId,
                senderName: newMsg.sender?.name,
                createdAt: newMsg.createdAt,
              },
              unreadCount: c.id === selectedChannelId ? 0 : c.unreadCount + 1,
            };
          }
          return c;
        })
      );
    };

    const handleReactionUpdated = (payload: { messageId: number; channelId: number; reactions: any[] }) => {
      if (payload.channelId === selectedChannelId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m))
        );
      }
    };

    const handleUserTyping = (data: { channelId: number; userId: number; userName: string }) => {
      if (data.channelId === selectedChannelId && data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.userName);
          return next;
        });
      }
    };

    const handleUserStopTyping = (data: { channelId: number; userId: number }) => {
      if (data.channelId === selectedChannelId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    const handleNotification = (data: {
      channelId: number;
      channelName: string;
      senderName: string;
      content: string;
      isMention: boolean;
    }) => {
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification(`💬 [${data.channelName}] ${data.senderName}`, {
          body: data.content,
          icon: '/favicon.ico',
        });
      }
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:reaction_updated', handleReactionUpdated);
    socket.on('chat:user_typing', handleUserTyping);
    socket.on('chat:user_stop_typing', handleUserStopTyping);
    socket.on('chat:notification', handleNotification);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:reaction_updated', handleReactionUpdated);
      socket.off('chat:user_typing', handleUserTyping);
      socket.off('chat:user_stop_typing', handleUserStopTyping);
      socket.off('chat:notification', handleNotification);
    };
  }, [selectedChannelId, currentUserId]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!selectedChannelId) return;

    const socket = getSocket();
    socket.emit('chat:join_channel', selectedChannelId);

    setLoadingMessages(true);
    getMessages(selectedChannelId)
      .then((res) => {
        setMessages(res.messages);
        markAsRead(selectedChannelId).catch(console.error);
        setChannels((prev) =>
          prev.map((c) => (c.id === selectedChannelId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch((err) => {
        console.error('Failed to load channel messages:', err);
      })
      .finally(() => setLoadingMessages(false));

    return () => {
      socket.emit('chat:leave_channel', selectedChannelId);
    };
  }, [selectedChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedChannelId) return;

    const content = inputText.trim();
    setInputText('');
    setMentionQuery(null);

    const socket = getSocket();
    socket.emit('chat:stop_typing', { channelId: selectedChannelId });

    try {
      const sentMessage = await sendMessage(selectedChannelId, { content });
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });

      setChannels((prev) =>
        prev.map((c) =>
          c.id === selectedChannelId
            ? {
                ...c,
                lastMessage: {
                  id: sentMessage.id,
                  content: sentMessage.content,
                  senderId: sentMessage.senderId,
                  senderName: sentMessage.sender?.name,
                  createdAt: sentMessage.createdAt,
                },
              }
            : c
        )
      );
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err.response?.data?.error || '메시지 전송에 실패했습니다.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.slice(1));
    } else {
      setMentionQuery(null);
    }

    if (!selectedChannelId) return;
    const socket = getSocket();

    socket.emit('chat:typing', {
      channelId: selectedChannelId,
      userName: authUser?.name || authUser?.email || '익명',
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stop_typing', { channelId: selectedChannelId });
    }, 2000);
  };

  const handleInsertMention = (mentionText: string) => {
    const words = inputText.split(' ');
    words.pop();
    const newText = [...words, `@${mentionText} `].join(' ');
    setInputText(newText);
    setMentionQuery(null);
  };

  const handleReactionClick = async (messageId: number, emoji: string) => {
    try {
      await toggleReaction(messageId, emoji);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const handleNotificationLevelChange = async (level: NotificationLevel, muteHours?: number) => {
    if (!selectedChannelId) return;

    let mutedUntil: string | null = null;
    if (level === 'MUTED' && muteHours) {
      const date = new Date(Date.now() + muteHours * 60 * 60 * 1000);
      mutedUntil = date.toISOString();
    }

    try {
      await updateMemberSettings(selectedChannelId, {
        notificationLevel: level,
        mutedUntil,
      });

      setChannels((prev) =>
        prev.map((c) =>
          c.id === selectedChannelId
            ? {
                ...c,
                mySettings: {
                  ...c.mySettings,
                  notificationLevel: level,
                  mutedUntil,
                },
              }
            : c
        )
      );
      setShowNotificationMenu(false);
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params: CreateChannelParams = {
        type: createType,
        name: createName,
        topic: createTopic,
        projectId: createType === 'PROJECT' ? (createProjectId || undefined) : undefined,
        groupId: createType === 'GROUP' ? (createGroupId || undefined) : undefined,
        targetUserId: createType === 'DM' ? (createTargetUserId || undefined) : undefined,
      };

      const newChan = await createChannel(params);
      setShowCreateModal(false);
      setCreateName('');
      setCreateTopic('');
      setCreateTargetUserId(null);

      await fetchChannels();
      setSelectedChannelId(newChan.id);
    } catch (err: any) {
      alert(err.response?.data?.error || '채널 생성에 실패했습니다.');
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
    } else if (type === 'GLOBAL') {
      setCreateName('');
    }
    setShowCreateModal(true);
  };

  const renderChannelItem = (channel: ChatChannel) => {
    const isSelected = channel.id === selectedChannelId;
    const isMuted = channel.mySettings?.notificationLevel === 'MUTED';
    const isMentionsOnly = channel.mySettings?.notificationLevel === 'MENTIONS_ONLY';

    return (
      <div
        key={channel.id}
        onClick={() => setSelectedChannelId(channel.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 8px',
          borderRadius: '4px',
          marginBottom: '2px',
          cursor: 'pointer',
          background: isSelected ? '#393c43' : 'transparent',
          color: isSelected ? '#fff' : isMuted ? '#72767d' : '#8e9297',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = '#2f3136';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {channel.type === 'DM' ? (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                user={channel.otherUser || undefined}
                name={channel.name}
                size={22}
                shape="circle"
              />
            </div>
          ) : (
            <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>
              {channel.icon || (channel.type === 'GLOBAL' ? '📢' : channel.type === 'PROJECT' ? '📁' : '👥')}
            </span>
          )}

          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: channel.unreadCount > 0 ? 600 : 400,
                color: channel.unreadCount > 0 ? '#fff' : isMuted ? '#72767d' : '#dcddde',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {channel.name}
            </div>
            {channel.lastMessage && (
              <div
                style={{
                  fontSize: '0.68rem',
                  color: '#72767d',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {channel.lastMessage.content}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FavoriteButton
            targetType="CHAT_CHANNEL"
            targetId={channel.id}
            isFavorite={channel.isFavorite}
            size="xs"
            onOpenAuth={onOpenAuth}
            onToggleSuccess={() => fetchChannels()}
          />

          {isMuted && (
            <span title="음소거됨" style={{ display: 'flex' }}>
              <BellOff size={12} color="#72767d" />
            </span>
          )}
          {isMentionsOnly && (
            <span title="@멘션만 수신" style={{ display: 'flex' }}>
              <AtSign size={12} color="#3b82f6" />
            </span>
          )}
          {channel.unreadCount > 0 && (
            <span
              style={{
                background: isMuted ? '#4f545c' : '#f43f5e',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                minWidth: '16px',
                textAlign: 'center',
              }}
            >
              {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
            </span>
          )}
        </div>
      </div>
    );
  };

  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      if (activeCategory !== 'ALL' && c.type !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.topic && c.topic.toLowerCase().includes(q));
      }
      return true;
    });
  }, [channels, activeCategory, searchQuery]);

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
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', background: '#1e1e1e', color: '#dcddde', overflow: 'hidden' }}>
      {/* 🧭 Column 1: Server/Category Nav (60px) */}
      <div
        style={{
          width: '60px',
          background: '#18181b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          gap: '12px',
          borderRight: '1px solid #27272a',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveCategory('ALL')}
          title="전체 채널"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: activeCategory === 'ALL' ? '14px' : '22px',
            background: activeCategory === 'ALL' ? 'var(--primary)' : '#27272a',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <MessageSquare size={20} />
        </button>

        <div style={{ width: '32px', height: '1px', background: '#3f3f46' }} />

        <button
          type="button"
          onClick={() => setActiveCategory('GLOBAL')}
          title="공용 채널"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: activeCategory === 'GLOBAL' ? '14px' : '22px',
            background: activeCategory === 'GLOBAL' ? 'var(--primary)' : '#27272a',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Globe size={20} />
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('PROJECT')}
          title="프로젝트 채널"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: activeCategory === 'PROJECT' ? '14px' : '22px',
            background: activeCategory === 'PROJECT' ? 'var(--primary)' : '#27272a',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <FolderKanban size={20} />
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('GROUP')}
          title="그룹/부서 채널"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: activeCategory === 'GROUP' ? '14px' : '22px',
            background: activeCategory === 'GROUP' ? 'var(--primary)' : '#27272a',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Users size={20} />
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('DM')}
          title="다이렉트 메시지 (DM)"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: activeCategory === 'DM' ? '14px' : '22px',
            background: activeCategory === 'DM' ? 'var(--primary)' : '#27272a',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <AtSign size={20} />
        </button>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          title="새 채널 / DM 만들기"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '22px',
            background: '#27272a',
            color: '#22c55e',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#22c55e';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#27272a';
            e.currentTarget.style.color = '#22c55e';
          }}
        >
          <Plus size={22} />
        </button>
      </div>

      {/* 📋 Column 2: Channels / DM List (240px) */}
      <div
        style={{
          width: '240px',
          background: '#202225',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #2f3136',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '12px', borderBottom: '1px solid #2f3136' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#121315',
              padding: '6px 10px',
              borderRadius: '4px',
              gap: '6px',
            }}
          >
            <Search size={14} color="#8e9297" />
            <input
              type="text"
              placeholder="대화방 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: '#dcddde',
                fontSize: '0.78rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {activeCategory === 'ALL' ? (
            CATEGORY_CONFIGS.map((cat) => {
              const catChannels = filteredChannels.filter((c) => c.type === cat.type);
              const isCollapsed = collapsedCategories[cat.type];
              const totalUnread = catChannels.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

              return (
                <div key={cat.type} style={{ marginBottom: '14px' }}>
                  {/* Category Splitter & Accordion Header */}
                  <div
                    onClick={() => toggleCategoryCollapse(cat.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 6px 6px 6px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      color: '#949ba4',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: '6px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#dcddde')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#949ba4')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                      <span>{cat.icon} {cat.label}</span>
                      <span style={{ fontSize: '0.68rem', color: '#6d727b', fontWeight: 500 }}>
                        ({catChannels.length})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isCollapsed && totalUnread > 0 && (
                        <span
                          style={{
                            background: '#f43f5e',
                            color: '#fff',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '8px',
                          }}
                        >
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleOpenCreateForCategory(cat.type, e)}
                        title={`${cat.label} 추가`}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#949ba4',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#949ba4')}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Channels under category */}
                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {catChannels.length === 0 ? (
                        <div style={{ padding: '6px 12px', color: '#72767d', fontSize: '0.72rem', fontStyle: 'italic', opacity: 0.7 }}>
                          등록된 대화방이 없습니다
                        </div>
                      ) : (
                        catChannels.map(renderChannelItem)
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div>
              {filteredChannels.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: '#72767d', fontSize: '0.76rem' }}>
                  참여 가능한 채널이 없습니다.
                </div>
              ) : (
                filteredChannels.map(renderChannelItem)
              )}
            </div>
          )}
        </div>
      </div>

      {/* 💬 Column 3: Active Chat Window */}
      {currentChannel ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#313338' }}>
          <div
            style={{
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              borderBottom: '1px solid #202225',
              background: '#313338',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>{currentChannel.icon || '💬'}</span>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                {currentChannel.name}
              </span>
              {currentChannel.topic && (
                <>
                  <span style={{ color: '#4f545c' }}>|</span>
                  <span style={{ fontSize: '0.76rem', color: '#949ba4' }}>{currentChannel.topic}</span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              <FavoriteButton
                targetType="CHAT_CHANNEL"
                targetId={currentChannel.id}
                isFavorite={currentChannel.isFavorite}
                size="lg"
                onOpenAuth={onOpenAuth}
                onToggleSuccess={() => fetchChannels()}
              />

              <button
                type="button"
                onClick={() => setShowNotificationMenu((prev) => !prev)}
                title="채널 알림 설정"
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentChannel.mySettings?.notificationLevel === 'MUTED' ? '#72767d' : '#b5bac1',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {currentChannel.mySettings?.notificationLevel === 'MUTED' ? <BellOff size={18} /> : <Bell size={18} />}
              </button>

              {showNotificationMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '32px',
                    right: '60px',
                    background: '#18191c',
                    border: '1px solid #2f3136',
                    borderRadius: '6px',
                    padding: '6px',
                    width: '210px',
                    zIndex: 50,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: '#949ba4', padding: '6px 8px', fontWeight: 600 }}>
                    알림 설정
                  </div>
                  <div
                    onClick={() => handleNotificationLevelChange('ALL')}
                    style={{
                      padding: '6px 8px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: currentChannel.mySettings?.notificationLevel === 'ALL' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    }}
                  >
                    <span>🔔 모든 메시지 (30초 쿨다운)</span>
                    {currentChannel.mySettings?.notificationLevel === 'ALL' && <CheckCircle2 size={14} color="#3b82f6" />}
                  </div>

                  <div
                    onClick={() => handleNotificationLevelChange('MENTIONS_ONLY')}
                    style={{
                      padding: '6px 8px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: currentChannel.mySettings?.notificationLevel === 'MENTIONS_ONLY' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    }}
                  >
                    <span>🏷️ @멘션만 수신 (권장)</span>
                    {currentChannel.mySettings?.notificationLevel === 'MENTIONS_ONLY' && <CheckCircle2 size={14} color="#3b82f6" />}
                  </div>

                  <div style={{ height: '1px', background: '#2f3136', margin: '4px 0' }} />

                  <div
                    onClick={() => handleNotificationLevelChange('MUTED', 1)}
                    style={{ padding: '6px 8px', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '4px', color: '#f43f5e' }}
                  >
                    🔕 1시간 동안 음소거
                  </div>
                  <div
                    onClick={() => handleNotificationLevelChange('MUTED')}
                    style={{ padding: '6px 8px', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '4px', color: '#f43f5e' }}
                  >
                    🔕 켤 때까지 영구 음소거
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowPinnedOnly((prev) => !prev)}
                title="고정된 메시지"
                style={{
                  background: showPinnedOnly ? 'rgba(255,255,255,0.1)' : 'none',
                  border: 'none',
                  color: showPinnedOnly ? '#fff' : '#b5bac1',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <Pin size={18} />
              </button>

              <button
                type="button"
                onClick={() => setShowMemberSidebar((prev) => !prev)}
                title="참여 멤버 목록"
                style={{
                  background: showMemberSidebar ? 'rgba(255,255,255,0.1)' : 'none',
                  border: 'none',
                  color: showMemberSidebar ? '#fff' : '#b5bac1',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                <Users size={18} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loadingMessages ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Spinner />
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#72767d' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
                      {currentChannel.name} 채널의 시작입니다!
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      첫 메시지를 남겨 대화를 시작해 보세요.
                    </div>
                  </div>
                ) : (
                  displayMessages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    const isMentioned = msg.mentions?.includes(currentUserId) || msg.mentions?.includes('@all');

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          position: 'relative',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: isMentioned ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                          borderLeft: isMentioned ? '3px solid #3b82f6' : 'none',
                        }}
                        onMouseEnter={() => setShowEmojiPickerForMsgId(msg.id)}
                        onMouseLeave={() => setShowEmojiPickerForMsgId(null)}
                      >
                        <Avatar user={msg.sender} name={msg.sender.name || ''} size={36} shape="circle" />

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.86rem', color: isMe ? '#38bdf8' : '#fff' }}>
                              {msg.sender.name || msg.sender.email}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#949ba4' }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.86rem', lineHeight: '1.4', color: '#dbdee1', whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                          </div>

                          {msg.reactions && msg.reactions.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {msg.reactions.map((r, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleReactionClick(msg.id, r.emoji)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: r.hasReacted ? '1px solid #3b82f6' : '1px solid #3f4147',
                                    background: r.hasReacted ? 'rgba(59, 130, 246, 0.15)' : '#2b2d31',
                                    color: '#dbdee1',
                                    fontSize: '0.74rem',
                                    cursor: 'pointer',
                                  }}
                                  title={r.users.map((u) => u.name).join(', ')}
                                >
                                  <span>{r.emoji}</span>
                                  <span>{r.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {showEmojiPickerForMsgId === msg.id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-12px',
                              right: '12px',
                              background: '#2b2d31',
                              border: '1px solid #383a40',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '2px 4px',
                              gap: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                              zIndex: 10,
                            }}
                          >
                            {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReactionClick(msg.id, emoji)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '0.9rem' }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {typingUsers.size > 0 && (
                <div style={{ padding: '0 16px 4px', fontSize: '0.72rem', color: '#949ba4', fontStyle: 'italic' }}>
                  {Array.from(typingUsers.values()).join(', ')}님이 입력 중입니다...
                </div>
              )}

              <div style={{ padding: '0 16px 16px', position: 'relative' }}>
                {mentionSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '60px',
                      left: '16px',
                      background: '#2b2d31',
                      border: '1px solid #383a40',
                      borderRadius: '6px',
                      padding: '4px',
                      width: '240px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      zIndex: 30,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', color: '#949ba4', padding: '4px 6px' }}>멤버 멘션하기</div>
                    {mentionSuggestions.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleInsertMention(String(m.name))}
                        style={{
                          padding: '6px 8px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#35373c')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        @{m.name}
                      </div>
                    ))}
                  </div>
                )}

                {!isAuthenticated ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#383a40',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', color: '#949ba4' }}>
                      🔒 실시간 채팅에 참여하려면 로그인이 필요합니다.
                    </span>
                    {onOpenAuth && (
                      <Button variant="primary" size="sm" onClick={onOpenAuth}>
                        로그인하기
                      </Button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#383a40',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        gap: '8px',
                      }}
                    >
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#b5bac1', cursor: 'pointer', padding: '2px' }}
                        title="파일 첨부"
                      >
                        <Paperclip size={18} />
                      </button>

                      <input
                        type="text"
                        placeholder={`#${currentChannel.name}에 메시지 보내기 (@로 멘션)`}
                        value={inputText}
                        onChange={handleInputChange}
                        style={{
                          flex: 1,
                          background: 'none',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.86rem',
                          outline: 'none',
                        }}
                      />

                      <button
                        type="submit"
                        disabled={!inputText.trim()}
                        style={{
                          background: inputText.trim() ? 'var(--primary)' : 'transparent',
                          border: 'none',
                          color: inputText.trim() ? '#fff' : '#6d7078',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: inputText.trim() ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {showMemberSidebar && (
              <div
                style={{
                  width: '200px',
                  background: '#2b2d31',
                  borderLeft: '1px solid #202225',
                  padding: '12px',
                  overflowY: 'auto',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#949ba4', marginBottom: '8px' }}>
                  참여 멤버 — {currentChannel.members?.length || 0}
                </div>

                {currentChannel.members?.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 4px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#35373c')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Avatar user={m.user} name={m.user?.name || ''} size={24} shape="circle" />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.8rem', color: '#dbdee1', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.user?.name || m.user?.email}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#949ba4' }}>{m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#72767d' }}>
          대화방을 선택해 주세요.
        </div>
      )}

      {/* ➕ Modal: Create Channel / Start DM */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: '420px',
              background: '#313338',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>대화방 만들기</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#949ba4', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateChannelSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.76rem', color: '#b5bac1', display: 'block', marginBottom: '6px' }}>채널 유형</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { type: 'GLOBAL' as ChannelType, label: '📢 공용 채널' },
                    { type: 'PROJECT' as ChannelType, label: '📁 프로젝트 채널' },
                    { type: 'GROUP' as ChannelType, label: '👥 그룹 채널' },
                    { type: 'DM' as ChannelType, label: '💬 1:1 DM' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setCreateType(item.type);
                        if (item.type === 'PROJECT' && allWorkspaceProjects.length > 0) {
                          setCreateProjectId(allWorkspaceProjects[0].id);
                          setCreateName(allWorkspaceProjects[0].name);
                        } else if (item.type === 'GROUP' && allWorkspaceGroups.length > 0) {
                          setCreateGroupId(allWorkspaceGroups[0].id);
                          setCreateName(allWorkspaceGroups[0].name);
                        } else if (item.type === 'GLOBAL') {
                          setCreateName('');
                        }
                      }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '4px',
                        border: createType === item.type ? '1px solid var(--primary)' : '1px solid #3f4147',
                        background: createType === item.type ? 'rgba(59, 130, 246, 0.15)' : '#2b2d31',
                        color: createType === item.type ? '#fff' : '#949ba4',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1:1 DM Selection */}
              {createType === 'DM' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.76rem', color: '#b5bac1', display: 'block', marginBottom: '6px' }}>상대방 선택</label>
                  <select
                    value={createTargetUserId || ''}
                    onChange={(e) => setCreateTargetUserId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#1e1f22',
                      border: '1px solid #3f4147',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                    }}
                    required
                  >
                    <option value="">대화할 멤버를 선택하세요</option>
                    {allWorkspaceUsers
                      .filter((u) => u.id !== currentUserId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* PROJECT Selection */}
              {createType === 'PROJECT' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.76rem', color: '#b5bac1', display: 'block', marginBottom: '6px' }}>프로젝트 선택</label>
                  <select
                    value={createProjectId || ''}
                    onChange={(e) => {
                      const pId = Number(e.target.value);
                      setCreateProjectId(pId);
                      const proj = allWorkspaceProjects.find((p) => p.id === pId);
                      if (proj) setCreateName(proj.name);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#1e1f22',
                      border: '1px solid #3f4147',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                    }}
                    required
                  >
                    <option value="">연동할 프로젝트를 선택하세요</option>
                    {allWorkspaceProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.key})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* GROUP Selection */}
              {createType === 'GROUP' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.76rem', color: '#b5bac1', display: 'block', marginBottom: '6px' }}>그룹/부서 선택</label>
                  <select
                    value={createGroupId || ''}
                    onChange={(e) => {
                      const gId = Number(e.target.value);
                      setCreateGroupId(gId);
                      const grp = allWorkspaceGroups.find((g) => g.id === gId);
                      if (grp) setCreateName(grp.name);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#1e1f22',
                      border: '1px solid #3f4147',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                    }}
                    required
                  >
                    <option value="">연동할 그룹을 선택하세요</option>
                    {allWorkspaceGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Common Channel Name and Topic (For GLOBAL, PROJECT, GROUP) */}
              {createType !== 'DM' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.76rem', color: '#b5bac1', display: 'block', marginBottom: '6px' }}>
                      {createType === 'PROJECT' ? '프로젝트 채널명' : createType === 'GROUP' ? '그룹 채널명' : '채널명'}
                    </label>
                    <input
                      type="text"
                      placeholder={createType === 'PROJECT' ? '예: 프로젝트-개발, 기획' : '예: 채널 이름'}
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1e1f22',
                        border: '1px solid #3f4147',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.76rem', color: '#b5bac1', display: 'block', marginBottom: '6px' }}>채널 설명 (선택)</label>
                    <input
                      type="text"
                      placeholder="채널의 목적이나 안내 사항을 적어주세요"
                      value={createTopic}
                      onChange={(e) => setCreateTopic(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1e1f22',
                        border: '1px solid #3f4147',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>취소</Button>
                <Button variant="primary" type="submit">생성하기</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
