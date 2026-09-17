import React from 'react';
import {
  ChatCategoryNav,
  ChatChannelSidebar,
  ChatMainArea,
  ChatMemberSidebar,
  ChatCreateModal,
} from '@/components/chat';
import { useChatRoom } from '@/components/chat/useChatRoom';

interface ChatPageProps {
  selectedChannelId?: number | null;
  onSelectChannel?: (channelId: number) => void;
  onOpenAuth?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  selectedChannelId: propChannelId,
  onSelectChannel,
  onOpenAuth,
}) => {
  const {
    isAuthenticated,
    currentUserId,
    allWorkspaceUsers,
    allWorkspaceProjects,
    allWorkspaceGroups,
    channels,
    selectedChannelId,
    setSelectedChannelId,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    collapsedCategories,
    toggleCategoryCollapse,
    showCreateModal,
    setShowCreateModal,
    createModalType,
    handleOpenCreateModal,
    handleOpenCreateForCategory,
    fetchChannels,
    currentChannel,
    displayMessages,
    loadingMessages,
    isSendingMessage,
    inputText,
    setInputText,
    showPinnedOnly,
    setShowPinnedOnly,
    showNotificationMenu,
    setShowNotificationMenu,
    showMemberSidebar,
    setShowMemberSidebar,
    showEmojiPickerForMsgId,
    setShowEmojiPickerForMsgId,
    typingUsers,
    messagesEndRef,
    handleSelectChannel,
    handleSendMessage,
    handleKeyDown,
    handleToggleReaction,
    handleTogglePin,
    handleReplyToMessage,
    handleSetNotificationLevel,
    mentionSuggestions,
    mentionQuery,
    setMentionQuery,
    handleSelectMention,
    setWsChannelId,
  } = useChatRoom({ propChannelId, onSelectChannel, onOpenAuth });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', height: 'calc(100vh - 56px)', background: '#1e1e1e', color: '#dcddde', overflow: 'hidden' }}>
      {/* 1. Category Nav (60px) */}
      <ChatCategoryNav
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        isAuthenticated={isAuthenticated}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {/* 2. Channels Sidebar (240px) */}
      <ChatChannelSidebar
        channels={channels}
        selectedChannelId={selectedChannelId}
        onSelectChannel={handleSelectChannel}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        collapsedCategories={collapsedCategories}
        toggleCategoryCollapse={toggleCategoryCollapse}
        handleOpenCreateForCategory={handleOpenCreateForCategory}
        fetchChannels={fetchChannels}
        onOpenAuth={onOpenAuth}
      />

      {/* 3. Main Chat Feed & Input Area */}
      <ChatMainArea
        currentChannel={currentChannel}
        showPinnedOnly={showPinnedOnly}
        setShowPinnedOnly={setShowPinnedOnly}
        showNotificationMenu={showNotificationMenu}
        setShowNotificationMenu={setShowNotificationMenu}
        showMemberSidebar={showMemberSidebar}
        setShowMemberSidebar={setShowMemberSidebar}
        handleSetNotificationLevel={handleSetNotificationLevel}
        loadingMessages={loadingMessages}
        displayMessages={displayMessages}
        currentUserId={currentUserId}
        showEmojiPickerForMsgId={showEmojiPickerForMsgId}
        setShowEmojiPickerForMsgId={setShowEmojiPickerForMsgId}
        typingUsers={typingUsers}
        messagesEndRef={messagesEndRef}
        handleToggleReaction={handleToggleReaction}
        handleTogglePin={handleTogglePin}
        handleReplyToMessage={handleReplyToMessage}
        isAuthenticated={isAuthenticated}
        isSendingMessage={isSendingMessage}
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

      {/* 4. Member Sidebar */}
      <ChatMemberSidebar
        showMemberSidebar={showMemberSidebar}
        currentChannel={currentChannel}
        allWorkspaceUsers={allWorkspaceUsers}
      />

      {/* 5. Create Channel Modal */}
      <ChatCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialType={createModalType}
        allWorkspaceUsers={allWorkspaceUsers}
        allWorkspaceProjects={allWorkspaceProjects}
        allWorkspaceGroups={allWorkspaceGroups}
        currentUserId={currentUserId}
        onSuccess={(newChan) => {
          fetchChannels();
          setSelectedChannelId(newChan.id);
          setWsChannelId(newChan.id);
        }}
      />
    </div>
  );
};
