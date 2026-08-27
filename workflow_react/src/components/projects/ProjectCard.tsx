// -*- coding: utf-8 -*-
import React from 'react';
import { Layers, Users, ArrowRight, Trash2 } from 'lucide-react';
import type { Project } from '../../types';
import { FavoriteButton } from '../common';

interface ProjectCardProps {
  project: Project;
  isAuthenticated: boolean;
  onSelectProject: (projectId: number) => void;
  onOpenDeleteConfirm: (e: React.MouseEvent, project: Project) => void;
  onOpenAuth?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isAuthenticated,
  onSelectProject,
  onOpenDeleteConfirm,
  onOpenAuth,
}) => {
  return (
    <div
      className="glass-panel glass-panel-hover"
      style={{
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        borderRadius: 'var(--radius-xs)',
        background: '#252526',
        border: '1px solid var(--border-light)',
        minHeight: '110px',
      }}
      onClick={() => onSelectProject(project.id)}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '2px',
              background: 'rgba(0, 122, 204, 0.15)',
              color: '#9cdcfe',
              border: '1px solid rgba(0, 122, 204, 0.3)',
            }}
          >
            {project.key}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FavoriteButton
              targetType="PROJECT"
              targetId={project.id}
              isFavorite={project.isFavorite}
              size="sm"
              onOpenAuth={onOpenAuth}
            />

            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              #{project.id}
            </span>

            {isAuthenticated && (
              <button
                onClick={(e) => onOpenDeleteConfirm(e, project)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title="삭제"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '4px' }}>
          {project.name}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-sub)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
          }}
        >
          {project.description || '설명 없음'}
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #383838',
          paddingTop: '6px',
          marginTop: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Layers size={11} /> {project._count?.issues ?? 0} 이슈
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Users size={11} /> {project._count?.members ?? (project.members?.length ?? 1)} 멤버
          </span>
        </div>

        <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 500 }}>
          열기 <ArrowRight size={11} />
        </span>
      </div>
    </div>
  );
};