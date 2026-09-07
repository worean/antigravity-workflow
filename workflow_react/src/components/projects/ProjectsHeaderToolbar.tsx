﻿import React from 'react';
import { Folder, LogIn, Sliders, Plus, Globe, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/common';
import type { ProjectVisibility } from '@/types';

export type VisibilityFilterType = 'ALL' | ProjectVisibility;

interface ProjectsHeaderToolbarProps {
  projectsCount: number;
  isAuthenticated: boolean;
  selectedVisibility: VisibilityFilterType;
  onChangeVisibility: (filter: VisibilityFilterType) => void;
  onOpenAuth?: () => void;
  onOpenCustomFields: () => void;
  onOpenCreateProject: () => void;
}

const FILTER_ITEMS: Array<{ key: VisibilityFilterType; label: string; icon?: React.ElementType }> = [
  { key: 'ALL', label: '전체' },
  { key: 'PUBLIC', label: '공개', icon: Globe },
  { key: 'PROTECTED', label: '보호', icon: ShieldCheck },
  { key: 'PRIVATE', label: '비공개', icon: Lock },
];

export const ProjectsHeaderToolbar: React.FC<ProjectsHeaderToolbarProps> = ({
  projectsCount,
  isAuthenticated,
  selectedVisibility,
  onChangeVisibility,
  onOpenAuth,
  onOpenCustomFields,
  onOpenCreateProject,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 10px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Folder size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            프로젝트 관리 ({projectsCount})
          </span>
        </div>

        {/* Visibility Filter Tabs */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-card-hover)',
            padding: '2px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-light)',
            gap: '2px',
          }}
        >
          {FILTER_ITEMS.map((item) => {
            const isSelected = selectedVisibility === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChangeVisibility(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {Icon && <Icon size={11} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {!isAuthenticated && onOpenAuth && (
          <Button variant="primary" size="sm" icon={<LogIn size={12} />} onClick={onOpenAuth}>
            로그인
          </Button>
        )}
        {isAuthenticated && (
          <>
            <Button variant="secondary" size="sm" icon={<Sliders size={12} />} onClick={onOpenCustomFields}>
              커스텀 필드
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={onOpenCreateProject}>
              프로젝트 생성
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
