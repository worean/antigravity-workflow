import React, { memo } from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import type { ChatChannel } from '@/types';
import { ChannelItem } from './ChannelItem';

interface DirectMessageListProps {
  channels: ChatChannel[];
  selectedChannelId: number | null;
  onSelectChannel: (channelId: number) => void;
  onOpenCreateDm: (e: React.MouseEvent) => void;
}

export const DirectMessageList: React.FC<DirectMessageListProps> = memo(({
  channels,
  selectedChannelId,
  onSelectChannel,
  onOpenCreateDm,
}) => {
  const dmChannels = channels.filter((c) => c.type === 'DM');

  return (
    <div style={{ marginTop: '12px', borderTop: '1px solid #1f2023', paddingTop: '12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '3px 6px',
          marginBottom: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageCircle size={13} color="var(--primary)" />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8e9297', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            다이렉트 메시지 ({dmChannels.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenCreateDm}
          title="새 다이렉트 메시지 시작"
          style={{ background: 'none', border: 'none', color: '#8e9297', cursor: 'pointer', padding: '2px' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8e9297')}
        >
          <Plus size={13} />
        </button>
      </div>

      {dmChannels.length === 0 ? (
        <div style={{ fontSize: '0.7rem', color: '#72767d', padding: '4px 8px' }}>
          진행 중인 1:1 대화가 없습니다.
        </div>
      ) : (
        dmChannels.map((channel) => (
          <ChannelItem
            key={channel.id}
            channel={channel}
            isSelected={channel.id === selectedChannelId}
            onSelectChannel={onSelectChannel}
          />
        ))
      )}
    </div>
  );
});
