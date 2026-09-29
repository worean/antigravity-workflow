import React, { memo } from 'react';
import { Pin, Paperclip } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { Avatar } from '@/components/common';

export const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🎉', '🚀', '👀', '😄', '💯'];

interface ChatMessageItemProps {
  msg: ChatMessage;
  currentUserId: number;
  showEmojiPickerForMsgId: number | null;
  setShowEmojiPickerForMsgId: (id: number | null) => void;
  handleToggleReaction: (messageId: number, emoji: string) => Promise<void>;
  handleTogglePin: (messageId: number, currentPinned?: boolean) => Promise<void>;
  handleReplyToMessage: (msg: ChatMessage) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = memo(({
  msg,
  currentUserId,
  showEmojiPickerForMsgId,
  setShowEmojiPickerForMsgId,
  handleToggleReaction,
  handleTogglePin,
  handleReplyToMessage,
}) => {
  return (
    <div
      key={msg.id}
      className="chat-message-row"
      style={{
        display: 'flex',
        gap: '12px',
        padding: '6px 16px',
        position: 'relative',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-subtle)';
        const actions = e.currentTarget.querySelector('.msg-actions') as HTMLElement;
        if (actions) actions.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        const actions = e.currentTarget.querySelector('.msg-actions') as HTMLElement;
        if (actions && showEmojiPickerForMsgId !== msg.id) actions.style.opacity = '0';
      }}
    >
      {/* Sender Avatar */}
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        <Avatar
          user={msg.sender || undefined}
          name={msg.sender?.name || msg.sender?.email || 'User'}
          size={36}
          shape="circle"
        />
      </div>

      {/* Message Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header: Name, Role, Time */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            {msg.sender?.name || msg.sender?.email?.split('@')[0] || '사용자'}
          </span>
          {msg.sender?.role === 'ADMIN' && (
            <span
              style={{
                fontSize: '0.62rem',
                background: 'rgba(230, 162, 60, 0.2)',
                color: 'var(--accent-yellow, #e6a23c)',
                padding: '1px 4px',
                borderRadius: '3px',
                fontWeight: 600,
              }}
            >
              PM
            </span>
          )}
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {msg.isPinned && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.65rem',
                color: 'var(--accent-yellow, #e6a23c)',
                background: 'rgba(230, 162, 60, 0.1)',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              <Pin size={10} /> 고정됨
            </span>
          )}
        </div>

        {/* Text Content */}
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-main)',
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
        </div>

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {msg.attachments.map((att: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                }}
              >
                <Paperclip size={12} color="var(--text-muted)" />
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none' }}
                >
                  {att.filename || '첨부파일'}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Reactions List */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
            {msg.reactions.map((r, idx) => {
              const isReactedByMe = r.hasReacted !== undefined ? r.hasReacted : r.users?.some((u: any) => u.id === currentUserId);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleToggleReaction(msg.id, r.emoji)}
                  style={{
                    background: isReactedByMe ? 'rgba(0, 122, 204, 0.15)' : 'var(--bg-card)',
                    border: `1px solid ${isReactedByMe ? 'var(--primary)' : 'var(--border-light)'}`,
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '0.72rem',
                    color: isReactedByMe ? 'var(--primary)' : 'var(--text-sub)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title={r.users?.map((u: any) => u.name).join(', ')}
                >
                  <span>{r.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.68rem' }}>{r.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Actions on Hover */}
      <div
        className="msg-actions"
        style={{
          position: 'absolute',
          right: '16px',
          top: '-12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '6px',
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          opacity: showEmojiPickerForMsgId === msg.id ? 1 : 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 10,
          transition: 'opacity 0.15s',
        }}
      >
        {QUICK_EMOJIS.slice(0, 3).map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleToggleReaction(msg.id, emoji)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '2px 4px',
              borderRadius: '4px',
            }}
            title={emoji}
          >
            {emoji}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowEmojiPickerForMsgId(showEmojiPickerForMsgId === msg.id ? null : msg.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-sub)',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: '0.75rem',
            borderRadius: '4px',
          }}
          title="더 많은 리액션"
        >
          ➕
        </button>

        <button
          type="button"
          onClick={() => handleTogglePin(msg.id, msg.isPinned)}
          style={{
            background: 'none',
            border: 'none',
            color: msg.isPinned ? 'var(--accent-yellow, #e6a23c)' : 'var(--text-sub)',
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
          }}
          title={msg.isPinned ? '고정 해제' : '메시지 고정'}
        >
          <Pin size={13} />
        </button>

        <button
          type="button"
          onClick={() => handleReplyToMessage(msg)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-sub)',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: '0.72rem',
            borderRadius: '4px',
          }}
          title="답글"
        >
          💬
        </button>

        {/* Emoji Palette Dropdown */}
        {showEmojiPickerForMsgId === msg.id && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '30px',
              background: 'var(--bg-modal)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '4px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              zIndex: 30,
            }}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  handleToggleReaction(msg.id, emoji);
                  setShowEmojiPickerForMsgId(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessageItem.displayName = 'ChatMessageItem';