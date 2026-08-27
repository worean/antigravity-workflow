// -*- coding: utf-8 -*-
import React from 'react';
import {
  Pin,
  Bell,
  BellOff,
  AtSign,
  Users,
  CheckCircle2,
} from 'lucide-react';
import type { ChatChannel, NotificationLevel } from '../../types';

interface ChatHeaderProps {
  currentChannel: ChatChannel | null;
  showPinnedOnly: boolean;
  setShowPinnedOnly: (show: boolean) => void;
  showNotificationMenu: boolean;
  setShowNotificationMenu: (show: boolean) => void;
  showMemberSidebar: boolean;
  setShowMemberSidebar: (show: boolean) => void;
  handleSetNotificationLevel: (level: NotificationLevel) => Promise<void>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
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
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#18181b',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.1rem' }}>
          {currentChannel.icon || (currentChannel.type === 'GLOBAL' ? '📢' : currentChannel.type === 'PROJECT' ? '📁' : '👥')}
        </span>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
          {currentChannel.name}
        </span>
        {currentChannel.topic && (
          <span style={{ fontSize: '0.75rem', color: '#72767d', marginLeft: '6px' }}>
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
            border: showPinnedOnly ? '1px solid #e6a23c' : 'none',
            color: showPinnedOnly ? '#e6a23c' : '#b9bbbe',
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
              color: '#b9bbbe',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {currentChannel.mySettings?.notificationLevel === 'MUTED' ? (
              <BellOff size={16} color="#72767d" />
            ) : currentChannel.mySettings?.notificationLevel === 'MENTIONS_ONLY' ? (
              <AtSign size={16} color="#3b82f6" />
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
                background: '#2b2d31',
                border: '1px solid #1f2023',
                borderRadius: '8px',
                padding: '6px',
                width: '180px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
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
                    color: currentChannel.mySettings?.notificationLevel === opt.level ? '#3b82f6' : '#dcddde',
                    background: 'none',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#35373c';
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
            background: showMemberSidebar ? '#393c43' : 'none',
            border: 'none',
            color: showMemberSidebar ? '#fff' : '#b9bbbe',
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
};