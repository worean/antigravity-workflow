import React from 'react';
import { LayoutDashboard, FolderKanban, CheckSquare, Zap, Clock, Code2, Settings } from 'lucide-react';
import { ProfileCard } from './ProfileCard';

export type TabType = 'dashboard' | 'projects' | 'issues' | 'sprints' | 'worklogs' | 'issue-detail' | 'settings';

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
  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'projects', label: '프로젝트 목록', icon: FolderKanban },
    { id: 'issues', label: '이슈 칸반 보드', icon: CheckSquare },
    { id: 'sprints', label: '스프린트 관리', icon: Zap },
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
                <span>{item.label}</span>
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
