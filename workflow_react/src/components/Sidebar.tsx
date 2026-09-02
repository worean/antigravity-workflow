import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Zap,
  Layers,
  Clock,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { SidebarBrand, SidebarNavItem, type SidebarSubitem } from './navigation';
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
  onOpenSettings?: () => void;
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
  onOpenSettings,
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

  const favoriteProjects: Project[] = favorites
    .filter((f) => f.targetType === 'PROJECT' && f.detail)
    .map((f) => f.detail);

  const favoriteChatChannels: ChatChannel[] = favorites
    .filter((f) => f.targetType === 'CHAT_CHANNEL' && f.detail)
    .map((f) => f.detail);

  const isItemActive = (itemId: string): boolean => {
    if (activeTab === itemId) return true;
    if (itemId === 'projects' && activeTab === 'project-detail') return true;
    if (itemId === 'issues' && activeTab === 'issue-detail') return true;
    return false;
  };

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
      subitems: favoriteChatChannels.map((c): SidebarSubitem => ({
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
      subitems: favoriteProjects.map((p): SidebarSubitem => ({
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
      subitems: favoriteProjects.map((p): SidebarSubitem => ({
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
      subitems: favoriteProjects.map((p): SidebarSubitem => ({
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
      subitems: favoriteProjects.map((p): SidebarSubitem => ({
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
        <SidebarBrand />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              isActive={isItemActive(item.id)}
              unreadCount={item.unreadCount}
              hasMention={item.hasMention}
              subitems={item.subitems}
              isSubmenuOpen={openSubmenus[item.id] ?? false}
              onToggleSubmenu={(e: React.MouseEvent) => toggleSubmenu(item.id, e)}
              onSelect={() => setActiveTab(item.id as TabType)}
              isSubitemActive={(subId: number) => isSubitemActive(subId, item.id)}
            />
          ))}
        </div>
      </div>

      <ProfileCard onOpenAuth={onOpenAuth} onOpenSettings={onOpenSettings || (() => setActiveTab('settings'))} />
    </aside>
  );
};
