import React from 'react';
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
import { useUnreadChatStats } from '@/api/chat';
import { useFavorites } from '@/api/favorites';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import type { Project, ChatChannel } from '@/types';

export type TabType =
  | 'dashboard'
  | 'projects'
  | 'issues'
  | 'sprints'
  | 'wbs'
  | 'worklogs'
  | 'chat'
  | 'issue-detail'
  | 'project-detail'
  | 'sprint-detail'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedProjectId?: number | null;
  selectedChannelId?: number | null;
  onOpenAuth?: () => void;
  onSelectProjectDetail?: (projectId: number) => void;
  onSelectProjectIssues?: (projectId: number) => void;
  onSelectProjectSprints?: (projectId: number) => void;
  onSelectProjectWBS?: (projectId: number) => void;
  onSelectChatChannel?: (channelId: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedProjectId,
  selectedChannelId,
  onOpenAuth,
  onSelectProjectDetail,
  onSelectProjectIssues,
  onSelectProjectSprints,
  onSelectProjectWBS,
  onSelectChatChannel,
}) => {
  const { isAuthenticated } = useAuth();
  const { sidebarSubmenus: openSubmenus, setSidebarSubmenus: setOpenSubmenus } = useWorkspace();
  const { totalUnreadCount, hasMentionUnread } = useUnreadChatStats();
  const { data: favorites = [] } = useFavorites(undefined, { enabled: isAuthenticated });

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

  // 상위 메뉴 활성화 여부 판정 (Routing Stack 추적 지원)
  const isItemActive = (itemId: string): boolean => {
    if (activeTab === itemId) return true;
    if (itemId === 'projects' && activeTab === 'project-detail') return true;
    if (itemId === 'issues' && activeTab === 'issue-detail') return true;
    return false;
  };

  // 하위 즐겨찾기 항목 활성화 여부 판정
  const isSubitemActive = (subId: number, parentId: string): boolean => {
    if (parentId === 'projects') {
      return selectedProjectId === subId && (activeTab === 'project-detail' || activeTab === 'projects');
    }
    if (parentId === 'issues') {
      return selectedProjectId === subId && activeTab === 'issues';
    }
    if (parentId === 'sprints') {
      return selectedProjectId === subId && activeTab === 'sprints';
    }
    if (parentId === 'chat') {
      return selectedChannelId === subId && activeTab === 'chat';
    }
    return false;
  };

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
        label: `${p.name}`,
        icon: '📁',
        onClick: () => {
          if (onSelectProjectSprints) onSelectProjectSprints(p.id);
          else setActiveTab('sprints');
        },
      })),
    },
    {
      id: 'wbs',
      label: 'WBS 간트 차트',
      icon: Layers,
      subitems: favoriteProjects.map((p) => ({
        id: p.id,
        label: `${p.name}`,
        icon: '📁',
        onClick: () => {
          if (onSelectProjectWBS) onSelectProjectWBS(p.id);
          else setActiveTab('wbs');
        },
      })),
    },
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
            padding: '8px 8px 12px 8px',
            borderBottom: '1px solid var(--border-light)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: 'var(--radius-xs)',
              background: 'linear-gradient(135deg, #007acc 0%, #0e639c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(0, 122, 204, 0.4)',
            }}
          >
            <Code2 size={14} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-bright)',
                letterSpacing: '-0.2px',
                lineHeight: 1.2,
              }}
            >
              AntiGravity
            </span>
            <span
              style={{
                fontSize: '0.65rem',
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
            const isActive = isItemActive(item.id);
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
                    {subitems.map((sub) => {
                      const isSubActive = isSubitemActive(sub.id, item.id);
                      return (
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
                            background: isSubActive ? 'rgba(0, 122, 204, 0.22)' : 'transparent',
                            color: isSubActive ? 'var(--accent-cyan)' : '#9ca3af',
                            fontWeight: isSubActive ? 600 : 400,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.08s ease, color 0.08s ease',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#9ca3af';
                            }
                          }}
                          title={sub.label}
                        >
                          <span style={{ fontSize: '0.8rem', flexShrink: 0 }}>{sub.icon}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {sub.label}
                          </span>
                          <Star size={10} fill="#eab308" color="#eab308" style={{ flexShrink: 0, opacity: 0.9 }} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* User Profile & Auth Trigger Section */}
      <ProfileCard onOpenAuth={onOpenAuth} />
    </aside>
  );
};