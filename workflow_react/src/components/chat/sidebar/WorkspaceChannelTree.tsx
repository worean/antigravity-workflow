import React, { memo } from 'react';
import { ChevronDown, ChevronRight, Plus, Building2 } from 'lucide-react';
import type { ChatChannel, ChannelType } from '@/types';
import { ChannelItem } from './ChannelItem';

interface WorkspaceChannelTreeProps {
  workspaceName: string;
  channels: ChatChannel[];
  selectedChannelId: number | null;
  onSelectChannel: (channelId: number) => void;
  collapsedCategories: Record<string, boolean>;
  toggleCategoryCollapse: (cat: ChannelType) => void;
  handleOpenCreateForCategory: (cat: ChannelType, e: React.MouseEvent) => void;
}

export const WorkspaceChannelTree: React.FC<WorkspaceChannelTreeProps> = memo(({
  workspaceName,
  channels,
  selectedChannelId,
  onSelectChannel,
  collapsedCategories,
  toggleCategoryCollapse,
  handleOpenCreateForCategory,
}) => {
  const globalChannels = channels.filter((c) => c.type === 'GLOBAL');
  const projectChannels = channels.filter((c) => c.type === 'PROJECT');
  const groupChannels = channels.filter((c) => c.type === 'GROUP');

  const isProjectCollapsed = collapsedCategories['PROJECT'];
  const isGroupCollapsed = collapsedCategories['GROUP'];

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* 🏢 Workspace Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          background: '#232428',
          borderRadius: '4px',
          marginBottom: '8px',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.82rem',
        }}
      >
        <Building2 size={15} color="var(--primary)" />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {workspaceName || '내 워크스페이스'}
        </span>
      </div>

      {/* 1. 전체 채널 (General Channels) */}
      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3px 6px',
            color: '#8e9297',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          <span>전체 채널</span>
          <button
            type="button"
            onClick={(e) => handleOpenCreateForCategory('GLOBAL', e)}
            title="전체 채널 추가"
            style={{ background: 'none', border: 'none', color: '#8e9297', cursor: 'pointer', padding: '2px' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8e9297')}
          >
            <Plus size={13} />
          </button>
        </div>

        {globalChannels.map((channel) => (
          <ChannelItem
            key={channel.id}
            channel={channel}
            isSelected={channel.id === selectedChannelId}
            onSelectChannel={onSelectChannel}
          />
        ))}
      </div>

      {/* 2. 프로젝트 채널 (Folder & Sub-channels) */}
      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3px 6px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => toggleCategoryCollapse('PROJECT')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isProjectCollapsed ? <ChevronRight size={12} color="#8e9297" /> : <ChevronDown size={12} color="#8e9297" />}
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8e9297', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              프로젝트 채널 ({projectChannels.length})
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleOpenCreateForCategory('PROJECT', e); }}
            title="프로젝트 채널 추가"
            style={{ background: 'none', border: 'none', color: '#8e9297', cursor: 'pointer', padding: '2px' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8e9297')}
          >
            <Plus size={13} />
          </button>
        </div>

        {!isProjectCollapsed && (
          <div style={{ marginTop: '2px' }}>
            {projectChannels.length === 0 ? (
              <div style={{ fontSize: '0.7rem', color: '#72767d', padding: '4px 18px' }}>
                프로젝트 채널이 없습니다.
              </div>
            ) : (
              projectChannels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isSelected={channel.id === selectedChannelId}
                  onSelectChannel={onSelectChannel}
                  indentLevel={1}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. 그룹 채널 (Folder & Sub-channels) */}
      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3px 6px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => toggleCategoryCollapse('GROUP')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isGroupCollapsed ? <ChevronRight size={12} color="#8e9297" /> : <ChevronDown size={12} color="#8e9297" />}
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8e9297', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              그룹 채널 ({groupChannels.length})
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleOpenCreateForCategory('GROUP', e); }}
            title="그룹 채널 추가"
            style={{ background: 'none', border: 'none', color: '#8e9297', cursor: 'pointer', padding: '2px' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8e9297')}
          >
            <Plus size={13} />
          </button>
        </div>

        {!isGroupCollapsed && (
          <div style={{ marginTop: '2px' }}>
            {groupChannels.length === 0 ? (
              <div style={{ fontSize: '0.7rem', color: '#72767d', padding: '4px 18px' }}>
                그룹 채널이 없습니다.
              </div>
            ) : (
              groupChannels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isSelected={channel.id === selectedChannelId}
                  onSelectChannel={onSelectChannel}
                  indentLevel={1}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});
