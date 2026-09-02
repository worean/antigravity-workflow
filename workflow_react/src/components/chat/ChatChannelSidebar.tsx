import React, { memo } from 'react';
import { Search } from 'lucide-react';
import type { ChatChannel, ChannelType } from '@/types';
import { useWorkspace } from '@/context/WorkspaceContext';
import { WorkspaceChannelTree, DirectMessageList } from './sidebar';

interface ChatChannelSidebarProps {
  channels: ChatChannel[];
  selectedChannelId: number | null;
  onSelectChannel: (channelId: number) => void;
  activeCategory: 'ALL' | ChannelType;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  collapsedCategories: Record<string, boolean>;
  toggleCategoryCollapse: (cat: ChannelType) => void;
  handleOpenCreateForCategory: (cat: ChannelType, e: React.MouseEvent) => void;
  fetchChannels: () => Promise<void>;
  onOpenAuth?: () => void;
}

export const ChatChannelSidebar: React.FC<ChatChannelSidebarProps> = memo(({
  channels,
  selectedChannelId,
  onSelectChannel,
  activeCategory,
  searchQuery,
  setSearchQuery,
  collapsedCategories,
  toggleCategoryCollapse,
  handleOpenCreateForCategory,
}) => {
  const { currentWorkspace } = useWorkspace();

  const filteredChannels = channels.filter((c) => {
    if (activeCategory !== 'ALL' && c.type !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.topic && c.topic.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div
      style={{
        width: '250px',
        background: '#2b2d31',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1f2023',
        flexShrink: 0,
      }}
    >
      {/* 1. Header & Search Bar */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #1f2023',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>채팅 채널</span>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search size={14} color="#72767d" style={{ position: 'absolute', left: '8px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="채널 검색..."
            style={{
              width: '100%',
              background: '#1e1f22',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 8px 5px 28px',
              fontSize: '0.75rem',
              color: '#dcddde',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* 2. Workspace Channel Tree & Direct Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {/* 🏢 1) 워크스페이스 채널 트리 (전체 / 프로젝트 / 그룹) */}
        {(activeCategory === 'ALL' || activeCategory === 'GLOBAL' || activeCategory === 'PROJECT' || activeCategory === 'GROUP') && (
          <WorkspaceChannelTree
            workspaceName={currentWorkspace?.name || '내 워크스페이스'}
            channels={filteredChannels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={onSelectChannel}
            collapsedCategories={collapsedCategories}
            toggleCategoryCollapse={toggleCategoryCollapse}
            handleOpenCreateForCategory={handleOpenCreateForCategory}
          />
        )}

        {/* 💬 2) 다이렉트 메시지 목록 (전역/독립) */}
        {(activeCategory === 'ALL' || activeCategory === 'DM') && (
          <DirectMessageList
            channels={filteredChannels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={onSelectChannel}
            onOpenCreateDm={(e) => handleOpenCreateForCategory('DM', e)}
          />
        )}
      </div>
    </div>
  );
});
