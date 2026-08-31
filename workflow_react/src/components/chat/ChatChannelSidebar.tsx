// -*- coding: utf-8 -*-
import React, { memo } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  BellOff,
  AtSign,
} from 'lucide-react';
import type { ChatChannel, ChannelType } from '@/types';
import { Avatar, FavoriteButton } from '@/components/common';
import { CATEGORY_CONFIGS } from './ChatCategoryNav';

interface ChannelItemProps {
  channel: ChatChannel;
  isSelected: boolean;
  onSelectChannel: (channelId: number) => void;
  fetchChannels: () => Promise<void>;
  onOpenAuth?: () => void;
}

const ChannelItem: React.FC<ChannelItemProps> = memo(({
  channel,
  isSelected,
  onSelectChannel,
  fetchChannels,
  onOpenAuth,
}) => {
  const isMuted = channel.mySettings?.notificationLevel === 'MUTED';
  const isMentionsOnly = channel.mySettings?.notificationLevel === 'MENTIONS_ONLY';

  return (
    <div
      onClick={() => onSelectChannel(channel.id)}
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
                color: isSelected ? '#b9bbbe' : '#72767d',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {channel.lastMessage.senderName ? `${channel.lastMessage.senderName}: ` : ''}
              {channel.lastMessage.content}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        {isMuted && <BellOff size={12} color="#72767d" />}
        {isMentionsOnly && <AtSign size={12} color="#3b82f6" />}

        {channel.unreadCount > 0 && (
          <span
            style={{
              background: '#f43f5e',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '10px',
              minWidth: '16px',
              textAlign: 'center',
            }}
          >
            {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
          </span>
        )}

        <div onClick={(e) => e.stopPropagation()}>
          <FavoriteButton
            targetType="CHAT_CHANNEL"
            targetId={channel.id}
            isFavorite={channel.isFavorite}
            onToggleSuccess={() => {
              fetchChannels();
            }}
            onOpenAuth={onOpenAuth}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
});

ChannelItem.displayName = 'ChannelItem';

interface ChatChannelSidebarProps {
  channels: ChatChannel[];
  selectedChannelId: number | null;
  onSelectChannel: (channelId: number) => void;
  activeCategory: 'ALL' | ChannelType;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  collapsedCategories: Record<ChannelType, boolean>;
  toggleCategoryCollapse: (type: ChannelType) => void;
  handleOpenCreateForCategory: (type: ChannelType, e: React.MouseEvent) => void;
  fetchChannels: () => Promise<void>;
  onOpenAuth?: () => void;
}

export const ChatChannelSidebar: React.FC<ChatChannelSidebarProps> = memo(({
  channels,
  selectedChannelId,
  onSelectChannel,
  activeCategory,
  searchQuery,
  setSearchQuery,
  collapsedCategories,
  toggleCategoryCollapse,
  handleOpenCreateForCategory,
  fetchChannels,
  onOpenAuth,
}) => {
  const filteredChannels = channels.filter((c) => {
    if (activeCategory !== 'ALL' && c.type !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.topic && c.topic.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div
      style={{
        width: '240px',
        background: '#2b2d31',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1f2023',
        flexShrink: 0,
      }}
    >
      {/* 1. Header & Search Bar */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #1f2023',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>채팅 채널</span>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search size={14} color="#72767d" style={{ position: 'absolute', left: '8px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="채널 검색..."
            style={{
              width: '100%',
              background: '#1e1f22',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 8px 5px 28px',
              fontSize: '0.75rem',
              color: '#dcddde',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* 2. Channel List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {activeCategory === 'ALL' ? (
          CATEGORY_CONFIGS.map((cat) => {
            const catChannels = filteredChannels.filter((c) => c.type === cat.type);
            const isCollapsed = collapsedCategories[cat.type];

            return (
              <div key={cat.type} style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleCategoryCollapse(cat.type)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isCollapsed ? <ChevronRight size={12} color="#8e9297" /> : <ChevronDown size={12} color="#8e9297" />}
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8e9297', textTransform: 'uppercase' }}>
                      {cat.label} ({catChannels.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleOpenCreateForCategory(cat.type, e)}
                    title={`${cat.label} 추가`}
                    style={{ background: 'none', border: 'none', color: '#8e9297', cursor: 'pointer', padding: '2px' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#8e9297')}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {!isCollapsed && (
                  <div style={{ marginTop: '2px' }}>
                    {catChannels.length === 0 ? (
                      <div style={{ fontSize: '0.72rem', color: '#72767d', padding: '6px 12px' }}>
                        채널이 없습니다.
                      </div>
                    ) : (
                      catChannels.map((channel) => (
                        <ChannelItem
                          key={channel.id}
                          channel={channel}
                          isSelected={channel.id === selectedChannelId}
                          onSelectChannel={onSelectChannel}
                          fetchChannels={fetchChannels}
                          onOpenAuth={onOpenAuth}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#8e9297',
                padding: '4px 6px',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              {CATEGORY_CONFIGS.find((c) => c.type === activeCategory)?.label} ({filteredChannels.length})
            </div>
            {filteredChannels.length === 0 ? (
              <div style={{ fontSize: '0.72rem', color: '#72767d', padding: '12px 8px', textAlign: 'center' }}>
                해당 카테고리에 채널이 없습니다.
              </div>
            ) : (
              filteredChannels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isSelected={channel.id === selectedChannelId}
                  onSelectChannel={onSelectChannel}
                  fetchChannels={fetchChannels}
                  onOpenAuth={onOpenAuth}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ChatChannelSidebar.displayName = 'ChatChannelSidebar';