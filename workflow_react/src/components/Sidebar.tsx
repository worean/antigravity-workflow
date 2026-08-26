import React from 'react';
import { LayoutDashboard, FolderKanban, CheckSquare, Zap, Layers, Clock, Code2, Settings, MessageSquare } from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { useUnreadChatStats } from '../api/chat';

export type TabType = 'dashboard' | 'projects' | 'issues' | 'sprints' | 'wbs' | 'worklogs' | 'chat' | 'issue-detail' | 'project-detail' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
}) => {
  const { totalUnreadCount, hasMentionUnread } = useUnreadChatStats();

  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'chat', label: '실시간 채팅', icon: MessageSquare, unreadCount: totalUnreadCount, hasMention: hasMentionUnread },
    { id: 'projects', label: '프로젝트 목록', icon: FolderKanban },
    { id: 'issues', label: '이슈 칸반 보드', icon: CheckSquare },
    { id: 'sprints', label: '스프린트 관리', icon: Zap },
    { id: 'wbs', label: 'WBS 간트 차트', icon: Layers },
    { id: 'worklogs', label: '작업 로그', icon: Clock },
    { id: 'settings', label: '환경 설정', icon: Settings },
  ];


  return (
    <aside
      style={{
        width: '205px',
        minWidth: '205px',
        maxWidth: '205px',
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
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
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
                <Icon size={14} color={isActive ? 'var(--accent-cyan)' : 'var(--text-sub)'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {Boolean(item.unreadCount && item.unreadCount > 0) && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '3px' }}>
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
              </button>
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
