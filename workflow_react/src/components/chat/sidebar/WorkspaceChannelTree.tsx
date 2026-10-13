import React, { memo } from 'react';
import { ChevronDown, ChevronRight, Plus, Building2 } from 'lucide-react';
import type { ChatChannel, ChannelType } from '@/types';
import { ChannelItem } from './ChannelItem';

interface WorkspaceChannelTreeProps {
  workspaceName: string;
  channels: ChatChannel[];
  selectedChannelId: number | null;
  onSelectChannel: (channelId: number) => void;
  activeCategory: 'ALL' | ChannelType;
  collapsedCategories: Record<string, boolean>;
  toggleCategoryCollapse: (cat: ChannelType) => void;
  handleOpenCreateForCategory: (cat: ChannelType, e: React.MouseEvent) => void;
  searchQuery?: string;
}

export const WorkspaceChannelTree: React.FC<WorkspaceChannelTreeProps> = memo(({
  workspaceName,
  channels,
  selectedChannelId,
  onSelectChannel,
  activeCategory,
  collapsedCategories,
  toggleCategoryCollapse,
  handleOpenCreateForCategory,
  searchQuery = '',
}) => {
  const globalChannels = channels.filter((c) => c.type === 'GLOBAL' || c.type === 'GENERAL');
  const projectChannels = channels.filter((c) => c.type === 'PROJECT');
  const groupChannels = channels.filter((c) => c.type === 'GROUP');

  const isGlobalCollapsed = collapsedCategories['GLOBAL'] ?? false;
  const isProjectCollapsed = collapsedCategories['PROJECT'] ?? false;
  const isGroupCollapsed = collapsedCategories['GROUP'] ?? false;

  const isCategoryAll = activeCategory === 'ALL';

  // 카테고리 선택에 맞춘 가시성 규칙 (선택된 카테고리만 출력하고, 불필요한 빈 collapse/expand 아이템 감춤)
  const showGlobal = isCategoryAll
    ? globalChannels.length > 0
    : activeCategory === 'GLOBAL' || activeCategory === 'GENERAL';

  const showProject = isCategoryAll
    ? projectChannels.length > 0
    : activeCategory === 'PROJECT';

  const showGroup = isCategoryAll
    ? groupChannels.length > 0
    : activeCategory === 'GROUP';

  const hasAnyVisibleSection = showGlobal || showProject || showGroup;

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* 🏢 Workspace Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-light)',
          borderRadius: '4px',
          marginBottom: '8px',
          color: 'var(--text-bright)',
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
      {showGlobal && (
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
            onClick={() => toggleCategoryCollapse('GLOBAL')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isGlobalCollapsed ? <ChevronRight size={12} color="var(--text-muted)" /> : <ChevronDown size={12} color="var(--text-muted)" />}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                전체 채널 ({globalChannels.length})
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleOpenCreateForCategory('GLOBAL', e); }}
              title="전체 채널 추가"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Plus size={13} />
            </button>
          </div>

          {!isGlobalCollapsed && (
            <div style={{ marginTop: '2px' }}>
              {globalChannels.length === 0 ? (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 18px' }}>
                  등록된 전체 채널이 없습니다.
                </div>
              ) : (
                globalChannels.map((channel) => (
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
      )}

      {/* 2. 프로젝트 채널 (Folder & Sub-channels) */}
      {showProject && (
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
              {isProjectCollapsed ? <ChevronRight size={12} color="var(--text-muted)" /> : <ChevronDown size={12} color="var(--text-muted)" />}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                프로젝트 채널 ({projectChannels.length})
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleOpenCreateForCategory('PROJECT', e); }}
              title="프로젝트 채널 추가"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Plus size={13} />
            </button>
          </div>

          {!isProjectCollapsed && (
            <div style={{ marginTop: '2px' }}>
              {projectChannels.length === 0 ? (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 18px' }}>
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
      )}

      {/* 3. 그룹 채널 (Folder & Sub-channels) */}
      {showGroup && (
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
              {isGroupCollapsed ? <ChevronRight size={12} color="var(--text-muted)" /> : <ChevronDown size={12} color="var(--text-muted)" />}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                그룹 채널 ({groupChannels.length})
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleOpenCreateForCategory('GROUP', e); }}
              title="그룹 채널 추가"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Plus size={13} />
            </button>
          </div>

          {!isGroupCollapsed && (
            <div style={{ marginTop: '2px' }}>
              {groupChannels.length === 0 ? (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 18px' }}>
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
      )}

      {/* 4. 빈 결과 플레이스홀더 (카테고리 내 채널이 없고 섹션도 표시되지 않는 경우) */}
      {!hasAnyVisibleSection && (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 8px' }}>
          {searchQuery ? '검색된 채널이 없습니다.' : '표시할 채널이 없습니다.'}
        </div>
      )}
    </div>
  );
});
