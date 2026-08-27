// -*- coding: utf-8 -*-
import React, { type RefObject } from 'react';
import { Pin, X } from 'lucide-react';
import type { ChatChannel, ChatMessage } from '../../types';
import { Spinner } from '../common';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatMessageListProps {
  currentChannel: ChatChannel | null;
  loadingMessages: boolean;
  displayMessages: ChatMessage[];
  showPinnedOnly: boolean;
  setShowPinnedOnly: (show: boolean) => void;
  currentUserId: number;
  showEmojiPickerForMsgId: number | null;
  setShowEmojiPickerForMsgId: (id: number | null) => void;
  typingUsers: Map<number, string>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  handleToggleReaction: (messageId: number, emoji: string) => Promise<void>;
  handleTogglePin: (messageId: number, currentPinned?: boolean) => Promise<void>;
  handleReplyToMessage: (msg: ChatMessage) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  currentChannel,
  loadingMessages,
  displayMessages,
  showPinnedOnly,
  setShowPinnedOnly,
  currentUserId,
  showEmojiPickerForMsgId,
  setShowEmojiPickerForMsgId,
  typingUsers,
  messagesEndRef,
  handleToggleReaction,
  handleTogglePin,
  handleReplyToMessage,
}) => {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {loadingMessages ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spinner label="메시지 불러오는 중..." />
        </div>
      ) : displayMessages.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#72767d',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '2.5rem' }}>💬</span>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
            {showPinnedOnly ? '고정된 메시지가 없습니다' : `#${currentChannel?.name} 채널에 오신 것을 환영합니다!`}
          </div>
          <div style={{ fontSize: '0.75rem' }}>
            {showPinnedOnly ? '중요한 메시지의 핀 아이콘을 눌러 고정할 수 있습니다.' : '채널의 첫 번째 메시지를 작성해 대화를 시작해보세요.'}
          </div>
        </div>
      ) : (
        <>
          {showPinnedOnly && (
            <div
              style={{
                background: 'rgba(230, 162, 60, 0.1)',
                border: '1px solid rgba(230, 162, 60, 0.3)',
                padding: '6px 16px',
                margin: '0 16px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#e6a23c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Pin size={13} />
                <span>고정된 메시지만 필터링하여 표시 중입니다 ({displayMessages.length}개)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPinnedOnly(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e6a23c',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <X size={12} /> 필터 해제
              </button>
            </div>
          )}

          {displayMessages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              msg={msg}
              currentUserId={currentUserId}
              showEmojiPickerForMsgId={showEmojiPickerForMsgId}
              setShowEmojiPickerForMsgId={setShowEmojiPickerForMsgId}
              handleToggleReaction={handleToggleReaction}
              handleTogglePin={handleTogglePin}
              handleReplyToMessage={handleReplyToMessage}
            />
          ))}

          {/* Typing Indicator */}
          {typingUsers.size > 0 && (
            <div
              style={{
                padding: '4px 16px',
                fontSize: '0.7rem',
                color: '#8e9297',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontStyle: 'italic',
              }}
            >
              <span>{Array.from(typingUsers.values()).join(', ')}님이 입력 중입니다...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};