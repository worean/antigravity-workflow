import React, { memo } from 'react';
import {
  Pin,
  Bell,
  BellOff,
  AtSign,
  Users,
  CheckCircle2,
} from 'lucide-react';
import type { ChatChannel, NotificationLevel } from '@/types';

interface ChatHeaderProps {
  currentChannel: ChatChannel | null;
  showPinnedOnly: boolean;
  setShowPinnedOnly: (show: boolean) => void;
  showNotificationMenu: boolean;
  setShowNotificationMenu: (show: boolean) => void;
  showMemberSidebar: boolean;
  setShowMemberSidebar: (show: boolean | ((prev: boolean) => boolean)) => void;
  handleSetNotificationLevel: (level: NotificationLevel) => Promise<void>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = memo(({
  currentChannel,
  showPinnedOnly,
  setShowPinnedOnly,
  showNotificationMenu,
  setShowNotificationMenu,
  showMemberSidebar,
  setShowMemberSidebar,
  handleSetNotificationLevel,
}) => {
  if (!currentChannel) return null;

  return (
    <div
      style={{
        height: '48px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'var(--bg-card)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.1rem' }}>
          {currentChannel.icon || (currentChannel.type === 'GLOBAL' ? '📢' : currentChannel.type === 'PROJECT' ? '📁' : '👥')}
        </span>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-bright)' }}>
          {currentChannel.name}
        </span>
        {currentChannel.topic && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
            | {currentChannel.topic}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Pinned Messages Filter Toggle */}
        <button
          type="button"
          onClick={() => setShowPinnedOnly(!showPinnedOnly)}
          title="고정된 메시지 보기"
          style={{
            background: showPinnedOnly ? 'rgba(230, 162, 60, 0.2)' : 'none',
            border: showPinnedOnly ? '1px solid var(--accent-yellow, #e6a23c)' : 'none',
            color: showPinnedOnly ? 'var(--accent-yellow, #e6a23c)' : 'var(--text-sub)',
            cursor: 'pointer',
            padding: '5px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.74rem',
          }}
        >
          <Pin size={14} />
          <span>고정됨</span>
        </button>

        {/* Notification Level Settings Menu */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            title="알림 설정"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {currentChannel.mySettings?.notificationLevel === 'MUTED' ? (
              <BellOff size={16} color="var(--text-muted)" />
            ) : currentChannel.mySettings?.notificationLevel === 'MENTIONS_ONLY' ? (
              <AtSign size={16} color="var(--primary)" />
            ) : (
              <Bell size={16} />
            )}
          </button>

          {showNotificationMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '32px',
                background: 'var(--bg-modal)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '6px',
                width: '180px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {[
                { level: 'ALL' as NotificationLevel, label: '모든 메시지 알림', icon: <Bell size={13} /> },
                { level: 'MENTIONS_ONLY' as NotificationLevel, label: '@멘션만 알림', icon: <AtSign size={13} /> },
                { level: 'MUTED' as NotificationLevel, label: '알림 끄기 (음소거)', icon: <BellOff size={13} /> },
              ].map((opt) => (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => handleSetNotificationLevel(opt.level)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    fontSize: '0.74rem',
                    color: currentChannel.mySettings?.notificationLevel === opt.level ? 'var(--primary)' : 'var(--text-main)',
                    background: 'none',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  {currentChannel.mySettings?.notificationLevel === opt.level && <CheckCircle2 size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Member Sidebar Toggle */}
        <button
          type="button"
          onClick={() => setShowMemberSidebar(!showMemberSidebar)}
          title="채널 멤버 목록"
          style={{
            background: showMemberSidebar ? 'var(--bg-subtle)' : 'none',
            border: 'none',
            color: showMemberSidebar ? 'var(--text-bright)' : 'var(--text-sub)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Users size={16} />
        </button>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';