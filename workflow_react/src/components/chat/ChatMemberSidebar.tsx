import React, { memo } from 'react';
import { Crown } from 'lucide-react';
import type { ChatChannel, User } from '@/types';
import { Avatar } from '@/components/common';

interface ChatMemberSidebarProps {
  showMemberSidebar: boolean;
  currentChannel: ChatChannel | null;
  allWorkspaceUsers: User[];
}

export const ChatMemberSidebar: React.FC<ChatMemberSidebarProps> = memo(({
  showMemberSidebar,
  currentChannel,
  allWorkspaceUsers: _allWorkspaceUsers,
}) => {
  if (!showMemberSidebar || !currentChannel) return null;

  return (
    <div
      style={{
        width: '200px',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
        gap: '12px',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        채널 멤버 ({currentChannel.members?.length || 0})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {currentChannel.members?.map((m) => {
          const userObj = m.user || {
            id: m.userId,
            name: (m as any).name,
            email: (m as any).email,
            avatar: (m as any).avatar,
            avatarColor: (m as any).avatarColor,
          };
          const displayName = userObj?.name || userObj?.email?.split('@')[0] || (m as any).name || '사용자';
          const deptOrTitle = [
            m.user?.department || (m as any).department,
            m.user?.jobTitle || (m as any).jobTitle,
          ].filter(Boolean).join(' · ');
          const bioText = m.user?.bio || (m as any).bio;

          return (
            <div
              key={m.id || m.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 6px',
                borderRadius: '4px',
              }}
              title={bioText ? `${displayName}\n${deptOrTitle ? `[${deptOrTitle}]\n` : ''}${bioText}` : undefined}
            >
              <Avatar user={userObj as any} size={24} shape="circle" />
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </span>
                  {m.role === 'ADMIN' && <Crown size={11} color="var(--accent-yellow, #e6a23c)" />}
                </div>
                {deptOrTitle && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                      marginTop: '1px',
                    }}
                  >
                    {deptOrTitle}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentChannel.topic && (
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            채널 설명 / 토픽
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>
            {currentChannel.topic}
          </div>
        </div>
      )}
    </div>
  );
});

ChatMemberSidebar.displayName = 'ChatMemberSidebar';