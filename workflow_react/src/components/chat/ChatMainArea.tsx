// -*- coding: utf-8 -*-
import React, { type RefObject } from 'react';
import type { ChatChannel, ChatMessage, NotificationLevel } from '../../types';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatInputArea } from './ChatInputArea';

interface ChatMainAreaProps {
  currentChannel: ChatChannel | null;
  showPinnedOnly: boolean;
  setShowPinnedOnly: (val: boolean) => void;
  showNotificationMenu: boolean;
  setShowNotificationMenu: (val: boolean) => void;
  showMemberSidebar: boolean;
  setShowMemberSidebar: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleSetNotificationLevel: (level: NotificationLevel) => Promise<void>;
  loadingMessages: boolean;
  displayMessages: ChatMessage[];
  currentUserId: number;
  showEmojiPickerForMsgId: number | null;
  setShowEmojiPickerForMsgId: (id: number | null) => void;
  typingUsers: Map<number, string>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  handleToggleReaction: (messageId: number, emoji: string) => Promise<void>;
  handleTogglePin: (messageId: number, currentPinned?: boolean) => Promise<void>;
  handleReplyToMessage: (msg: ChatMessage) => void;
  isAuthenticated: boolean;
  inputText: string;
  setInputText: (val: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  mentionSuggestions: { id: string | number; name: string; type: string }[];
  mentionQuery: string | null;
  handleSelectMention: (item: { id: string | number; name: string; type: string }) => void;
  setMentionQuery: (val: string | null) => void;
  onOpenAuth?: () => void;
}

export const ChatMainArea: React.FC<ChatMainAreaProps> = ({
  currentChannel,
  showPinnedOnly,
  setShowPinnedOnly,
  showNotificationMenu,
  setShowNotificationMenu,
  showMemberSidebar,
  setShowMemberSidebar,
  handleSetNotificationLevel,
  loadingMessages,
  displayMessages,
  currentUserId,
  showEmojiPickerForMsgId,
  setShowEmojiPickerForMsgId,
  typingUsers,
  messagesEndRef,
  handleToggleReaction,
  handleTogglePin,
  handleReplyToMessage,
  isAuthenticated,
  inputText,
  setInputText,
  handleSendMessage,
  handleKeyDown,
  mentionSuggestions,
  mentionQuery,
  handleSelectMention,
  setMentionQuery,
  onOpenAuth,
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#313338',
        position: 'relative',
        minWidth: 0,
      }}
    >
      {/* 1. Header */}
      <ChatHeader
        currentChannel={currentChannel}
        showPinnedOnly={showPinnedOnly}
        setShowPinnedOnly={setShowPinnedOnly}
        showNotificationMenu={showNotificationMenu}
        setShowNotificationMenu={setShowNotificationMenu}
        showMemberSidebar={showMemberSidebar}
        setShowMemberSidebar={setShowMemberSidebar}
        handleSetNotificationLevel={handleSetNotificationLevel}
      />

      {/* 2. Message Feed */}
      <ChatMessageList
        currentChannel={currentChannel}
        loadingMessages={loadingMessages}
        displayMessages={displayMessages}
        showPinnedOnly={showPinnedOnly}
        setShowPinnedOnly={setShowPinnedOnly}
        currentUserId={currentUserId}
        showEmojiPickerForMsgId={showEmojiPickerForMsgId}
        setShowEmojiPickerForMsgId={setShowEmojiPickerForMsgId}
        typingUsers={typingUsers}
        messagesEndRef={messagesEndRef}
        handleToggleReaction={handleToggleReaction}
        handleTogglePin={handleTogglePin}
        handleReplyToMessage={handleReplyToMessage}
      />

      {/* 3. Input Area */}
      <ChatInputArea
        currentChannel={currentChannel}
        isAuthenticated={isAuthenticated}
        inputText={inputText}
        setInputText={setInputText}
        handleSendMessage={handleSendMessage}
        handleKeyDown={handleKeyDown}
        mentionSuggestions={mentionSuggestions}
        mentionQuery={mentionQuery}
        handleSelectMention={handleSelectMention}
        setMentionQuery={setMentionQuery}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};