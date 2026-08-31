// -*- coding: utf-8 -*-
import React from 'react';
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

export const ChatChannelSidebar: React.FC<ChatChannelSidebarProps> = ({
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

  const renderChannelItem = (channel: ChatChannel) => {
    const isSelected = channel.id === selectedChannelId;
    const isMuted = channel.mySettings?.notificationLevel === 'MUTED';
    const isMentionsOnly = channel.mySettings?.notificationLevel === 'MENTIONS_ONLY';

    return (
      <div
        key={channel.id}
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

  return (
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
      {/* Search Header */}
      <div style={{ padding: '12px', borderBottom: '1px solid #2f3136' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#18181b',
            borderRadius: '4px',
            padding: '6px 10px',
            gap: '8px',
          }}
        >
          <Search size={14} color="#72767d" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="채널 또는 토픽 검색..."
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '0.78rem',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Channel Categories List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {activeCategory === 'ALL' ? (
          CATEGORY_CONFIGS.map((cat) => {
            const catChannels = filteredChannels.filter((c) => c.type === cat.type);
            const isCollapsed = collapsedCategories[cat.type];

            return (
              <div key={cat.type} style={{ marginBottom: '14px' }}>
                <div
                  onClick={() => toggleCategoryCollapse(cat.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#8e9297',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dcddde';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#8e9297';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span>{cat.label}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({catChannels.length})</span>
                  </div>

                  {cat.type !== 'DM' && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenCreateForCategory(cat.type, e)}
                      title="채널 추가"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {!isCollapsed && (
                  <div style={{ marginTop: '4px' }}>
                    {catChannels.length === 0 ? (
                      <div style={{ fontSize: '0.7rem', color: '#5865f2', padding: '4px 8px', fontStyle: 'italic' }}>
                        채널이 없습니다
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
              filteredChannels.map(renderChannelItem)
            )}
          </div>
        )}
      </div>
    </div>
  );
};