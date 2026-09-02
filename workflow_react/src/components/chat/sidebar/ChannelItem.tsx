import React, { memo } from 'react';
import { BellOff, AtSign } from 'lucide-react';
import type { ChatChannel } from '@/types';
import { Avatar } from '@/components/common';

interface ChannelItemProps {
  channel: ChatChannel;
  isSelected: boolean;
  onSelectChannel: (channelId: number) => void;
  indentLevel?: number;
}

export const ChannelItem: React.FC<ChannelItemProps> = memo(({
  channel,
  isSelected,
  onSelectChannel,
  indentLevel = 0,
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
        padding: '6px 8px',
        paddingLeft: indentLevel > 0 ? `${8 + indentLevel * 14}px` : '8px',
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
              size={20}
              shape="circle"
            />
          </div>
        ) : (
          <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>
            {channel.icon || (channel.type === 'GLOBAL' ? '📢' : channel.type === 'PROJECT' ? '📁' : '👥')}
          </span>
        )}

        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '0.8rem',
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
      </div>
    </div>
  );
});
