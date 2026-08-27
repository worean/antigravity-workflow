// -*- coding: utf-8 -*-
import React from 'react';
import { Folder, LogIn, Sliders, Plus } from 'lucide-react';
import { Button } from '../common';

interface ProjectsHeaderToolbarProps {
  projectsCount: number;
  isAuthenticated: boolean;
  onOpenAuth?: () => void;
  onOpenCustomFields: () => void;
  onOpenCreateProject: () => void;
}

export const ProjectsHeaderToolbar: React.FC<ProjectsHeaderToolbarProps> = ({
  projectsCount,
  isAuthenticated,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Folder size={14} color="var(--primary)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          프로젝트 관리 ({projectsCount})
        </span>
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