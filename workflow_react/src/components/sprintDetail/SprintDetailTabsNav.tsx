// -*- coding: utf-8 -*-
import React from 'react';
import { MessageSquare, Clock, FileText, Layers } from 'lucide-react';

export type SprintDetailTabType = 'discussions' | 'worklogs' | 'notes' | 'issues';

interface SprintDetailTabsNavProps {
  activeTab: SprintDetailTabType;
  setActiveTab: (tab: SprintDetailTabType) => void;
  issuesCount: number;
}

export const SprintDetailTabsNav: React.FC<SprintDetailTabsNavProps> = ({
  activeTab,
  setActiveTab,
  issuesCount,
}) => {
  const tabs: { id: SprintDetailTabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'discussions', label: '실시간 논의 피드', icon: <MessageSquare size={14} /> },
    { id: 'worklogs', label: '작업 일지 타임라인', icon: <Clock size={14} /> },
    { id: 'notes', label: '스프린트 회의록 & 메모', icon: <FileText size={14} /> },
    { id: 'issues', label: '할당된 이슈 목록', icon: <Layers size={14} />, count: issuesCount },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '2px',
        marginBottom: '12px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : 'var(--text-muted)',
              background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};