import React from 'react';
import { LayoutDashboard, FolderKanban, CheckSquare, Zap, Clock } from 'lucide-react';

export type TabType = 'dashboard' | 'projects' | 'issues' | 'sprints' | 'worklogs' | 'issue-detail';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'projects', label: '프로젝트 목록', icon: FolderKanban },
    { id: 'issues', label: '이슈 칸반 보드', icon: CheckSquare },
    { id: 'sprints', label: '스프린트 관리', icon: Zap },
    { id: 'worklogs', label: '작업 로그', icon: Clock },
  ];

  return (
    <aside
      style={{
        width: '240px',
        minHeight: 'calc(100vh - 67px)',
        borderRight: '1px solid var(--border-light)',
        background: 'rgba(15, 21, 35, 0.6)',
        backdropFilter: 'blur(12px)',
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 10px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          메뉴 Navigation
        </div>
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
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0.05) 100%)'
                  : 'transparent',
                color: isActive ? 'var(--text-main)' : 'var(--text-sub)',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              }}
            >
              <Icon size={18} color={isActive ? 'var(--primary)' : 'var(--text-sub)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Info Box */}
      <div
        className="glass-panel"
        style={{
          padding: '14px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px' }}>
          Workflow System v1.0
        </div>
        <div>Node.js Express + Prisma ORM + React (Vite) API Integration</div>
      </div>
    </aside>
  );
};
