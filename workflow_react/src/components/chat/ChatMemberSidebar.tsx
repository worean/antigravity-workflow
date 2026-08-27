import React from 'react';
import { Crown } from 'lucide-react';
import type { ChatChannel, User } from '../../types';
import { Avatar } from '../common';

interface ChatMemberSidebarProps {
  showMemberSidebar: boolean;
  currentChannel: ChatChannel | null;
  allWorkspaceUsers: User[];
}

export const ChatMemberSidebar: React.FC<ChatMemberSidebarProps> = ({
  showMemberSidebar,
  currentChannel,
  allWorkspaceUsers: _allWorkspaceUsers,
}) => {
  if (!showMemberSidebar || !currentChannel) return null;

  return (
    <div
      style={{
        width: '200px',
        background: '#2b2d31',
        borderLeft: '1px solid #1f2023',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
        gap: '12px',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8e9297', textTransform: 'uppercase' }}>
        채널 멤버 ({currentChannel.members?.length || 0})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {currentChannel.members?.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 6px',
              borderRadius: '4px',
            }}
          >
            <Avatar user={m.user || undefined} size={24} shape="circle" />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    color: '#dcddde',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.user?.name || m.user?.email?.split('@')[0] || '사용자'}
                </span>
                {m.role === 'ADMIN' && <Crown size={11} color="#e6a23c" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentChannel.topic && (
        <div style={{ marginTop: '12px', borderTop: '1px solid #35373c', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8e9297', textTransform: 'uppercase', marginBottom: '4px' }}>
            채널 설명 / 토픽
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b9bbbe', lineHeight: 1.4 }}>
            {currentChannel.topic}
          </div>
        </div>
      )}
    </div>
  );
};