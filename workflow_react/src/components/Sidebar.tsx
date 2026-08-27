import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Zap,
  Layers,
  Clock,
  Code2,
  Settings,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Star,
} from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { useUnreadChatStats } from '../api/chat';
import { useFavorites } from '../api/favorites';
import { useAuth } from '../context/AuthContext';
import type { Project, ChatChannel } from '../types';

export type TabType = 'dashboard' | 'projects' | 'issues' | 'sprints' | 'wbs' | 'worklogs' | 'chat' | 'issue-detail' | 'project-detail' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAuth?: () => void;
  onSelectProjectDetail?: (projectId: number) => void;
  onSelectProjectIssues?: (projectId: number) => void;
  onSelectProjectWBS?: (projectId: number) => void;
  onSelectChatChannel?: (channelId: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onSelectProjectDetail,
  onSelectProjectIssues,
  onSelectProjectWBS,
  onSelectChatChannel,
}) => {
  const { isAuthenticated } = useAuth();
  const { totalUnreadCount, hasMentionUnread } = useUnreadChatStats();
  const { data: favorites = [] } = useFavorites(undefined, { enabled: isAuthenticated });

  // 서브메뉴 접기/열기 상태 (기본 접힘: false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    projects: false,
    issues: false,
    sprints: false,
    chat: false,
  });

  const toggleSubmenu = (menuId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSubmenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  // 즐겨찾기 항목 추출
  const favoriteProjects: Project[] = favorites
    .filter((f) => f.targetType === 'PROJECT' && f.detail)
    .map((f) => f.detail);

  const favoriteChatChannels: ChatChannel[] = favorites
    .filter((f) => f.targetType === 'CHAT_CHANNEL' && f.detail)
    .map((f) => f.detail);

  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    {
      id: 'chat',
      label: '실시간 채팅',
      icon: MessageSquare,
      unreadCount: totalUnreadCount,
      hasMention: hasMentionUnread,
      subitems: favoriteChatChannels.map((c) => ({
        id: c.id,
        label: c.name,
        icon: c.icon || '💬',
        onClick: () => {
          if (onSelectChatChannel) onSelectChatChannel(c.id);
          else setActiveTab('chat');
        },
      })),
    },
    {
      id: 'projects',
      label: '프로젝트 목록',
      icon: FolderKanban,
      subitems: favoriteProjects.map((p) => ({
        id: p.id,
        label: `${p.name} (${p.key})`,
        icon: '📁',
        onClick: () => {
          if (onSelectProjectDetail) onSelectProjectDetail(p.id);
          else setActiveTab('projects');
        },
      })),
    },
    {
      id: 'issues',
      label: '이슈 칸반 보드',
      icon: CheckSquare,
      subitems: favoriteProjects.map((p) => ({
        id: p.id,
        label: `${p.name} (${p.key})`,
        icon: '📁',
        onClick: () => {
          if (onSelectProjectIssues) onSelectProjectIssues(p.id);
          else setActiveTab('issues');
        },
      })),
    },
    {
      id: 'sprints',
      label: '스프린트 관리',
      icon: Zap,
      subitems: favoriteProjects.map((p) => ({
        id: p.id,
        label: `${p.name} (WBS)`,
        icon: '📁',
        onClick: () => {
          if (onSelectProjectWBS) onSelectProjectWBS(p.id);
          else setActiveTab('wbs');
        },
      })),
    },
    { id: 'wbs', label: 'WBS 간트 차트', icon: Layers },
    { id: 'worklogs', label: '작업 로그', icon: Clock },
    { id: 'settings', label: '환경 설정', icon: Settings },
  ];

  return (
    <aside
      style={{
        width: '215px',
        minWidth: '215px',
        maxWidth: '215px',
        height: '100%',
        flexShrink: 0,
        borderRight: '1px solid var(--border-light)',
        background: 'var(--bg-sidebar)',
        padding: '8px 6px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* AntiGravity Workflow Brand Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px 10px',
            borderBottom: '1px solid var(--border-light)',
            marginBottom: '4px',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Code2 size={13} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)' }}>
              AntiGravity
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent-cyan)',
                background: 'rgba(0,122,204,0.15)',
                padding: '0 4px',
                borderRadius: '2px',
                fontWeight: 600,
              }}
            >
              Workflow
            </span>
          </div>
        </div>

        {/* Menu Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const subitems = item.subitems || [];
            const hasSubitems = subitems.length > 0;
            const isSubmenuOpen = openSubmenus[item.id] ?? false;

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id as TabType)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    padding: '6px 8px',
                    minHeight: '30px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: isActive ? '#37373d' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-main)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.08s ease',
                    borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#2a2d2e';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                    <Icon size={14} color={isActive ? 'var(--accent-cyan)' : 'var(--text-sub)'} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {Boolean(item.unreadCount && item.unreadCount > 0) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {item.hasMention && (
                          <span
                            style={{
                              background: '#3b82f6',
                              color: '#fff',
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              padding: '0 3px',
                              borderRadius: '4px',
                              height: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="@멘션 메시지 있음"
                          >
                            @
                          </span>
                        )}
                        <span
                          style={{
                            background: '#f43f5e',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '10px',
                            minWidth: '16px',
                            height: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.unreadCount! > 99 ? '99+' : item.unreadCount}
                        </span>
                      </div>
                    )}

                    {/* 즐겨찾기 하위 항목이 있을 때만 표시되는 접기/펼치기 버튼 */}
                    {hasSubitems && (
                      <div
                        role="button"
                        onClick={(e) => toggleSubmenu(item.id, e)}
                        title={isSubmenuOpen ? '즐겨찾기 하위 항목 접기' : '즐겨찾기 하위 항목 펼치기'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px',
                          borderRadius: '2px',
                          color: '#949ba4',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#949ba4')}
                      >
                        {isSubmenuOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </div>
                    )}
                  </div>
                </button>

                {/* 하위 즐겨찾기 목록 (Tree Guide Lines & Indentation) */}
                {hasSubitems && isSubmenuOpen && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1px',
                      marginLeft: '14px',
                      paddingLeft: '6px',
                      borderLeft: '2px solid rgba(255,255,255,0.08)',
                      marginTop: '2px',
                      marginBottom: '2px',
                    }}
                  >
                    {subitems.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={sub.onClick}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 8px',
                          minHeight: '26px',
                          borderRadius: 'var(--radius-xs)',
                          border: 'none',
                          background: 'transparent',
                          color: '#9ca3af',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.08s ease, color 0.08s ease',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                        title={sub.label}
                      >
                        <span style={{ fontSize: '0.8rem', flexShrink: 0 }}>{sub.icon}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {sub.label}
                        </span>
                        <Star size={10} fill="#eab308" color="#eab308" style={{ flexShrink: 0, opacity: 0.8 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Fixed Profile Card (Always visible on screen) */}
      <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
        <ProfileCard
          onOpenAuth={onOpenAuth}
          onOpenSettings={() => setActiveTab('settings')}
        />
      </div>
    </aside>
  );
};
