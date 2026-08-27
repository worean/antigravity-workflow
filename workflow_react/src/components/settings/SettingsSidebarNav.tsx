// -*- coding: utf-8 -*-
import React from 'react';
import { User, Users, Sliders, Palette, Server } from 'lucide-react';

export type SettingsTabType = 'profile' | 'organization' | 'customFields' | 'display' | 'system';

interface SettingsSidebarNavProps {
  activeSubTab: SettingsTabType;
  setActiveSubTab: (tab: SettingsTabType) => void;
}

export const SettingsSidebarNav: React.FC<SettingsSidebarNavProps> = ({
  activeSubTab,
  setActiveSubTab,
}) => {
  const tabs = [
    { id: 'profile' as const, label: '사용자 프로필', icon: User },
    { id: 'organization' as const, label: '조직도 및 권한 관리', icon: Users },
    { id: 'customFields' as const, label: '이슈 커스텀 필드', icon: Sliders },
    { id: 'display' as const, label: '디스플레이 & 테마', icon: Palette },
    { id: 'system' as const, label: '시스템 상태 & 정보', icon: Server },
  ];

  return (
    <div
      style={{
        width: '200px',
        flexShrink: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '6px',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSubTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              fontSize: '0.78rem',
              fontWeight: isActive ? 600 : 400,
              background: isActive ? '#37373d' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-main)',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Icon size={14} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};