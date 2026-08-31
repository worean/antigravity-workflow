import React from 'react';
import { FolderKanban } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectBadgeProps {
  project?: Project | null;
  projectId?: number | null;
  size?: 'sm' | 'md';
}

export const ProjectBadge: React.FC<ProjectBadgeProps> = ({ project, projectId, size = 'md' }) => {
  const name = project?.name || (projectId ? `Project #${projectId}` : '미지정 프로젝트');
  const key = project?.key;

  const fontSize = size === 'sm' ? '0.75rem' : '0.85rem';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize,
        color: 'var(--text-sub)',
        userSelect: 'none',
      }}
    >
      <FolderKanban size={iconSize} color="var(--primary)" />
      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{name}</span>
      {key && (
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          {key}
        </span>
      )}
    </span>
  );
};
