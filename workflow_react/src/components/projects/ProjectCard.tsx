import React from 'react';
import { Layers, Users, ArrowRight, Trash2, Globe, ShieldCheck, Lock } from 'lucide-react';
import type { Project, ProjectVisibility } from '@/types';
import { FavoriteButton } from '@/components/common';

interface ProjectCardProps {
  project: Project;
  isAuthenticated: boolean;
  onSelectProject: (projectId: number) => void;
  onOpenDeleteConfirm: (e: React.MouseEvent, project: Project) => void;
  onToggleFavoriteSuccess?: (isFavorite: boolean) => void;
  onOpenAuth?: () => void;
}

const renderVisibilityBadge = (vis?: ProjectVisibility) => {
  switch (vis) {
    case 'PROTECTED':
      return (
        <span
          title="부서/그룹 한정 보호 프로젝트"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.64rem',
            padding: '1px 5px',
            borderRadius: '2px',
            background: 'rgba(215, 186, 125, 0.15)',
            color: '#dcdcaa',
            border: '1px solid rgba(215, 186, 125, 0.3)',
          }}
        >
          <ShieldCheck size={10} />
          <span>보호</span>
        </span>
      );
    case 'PRIVATE':
      return (
        <span
          title="비공개 프로젝트"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.64rem',
            padding: '1px 5px',
            borderRadius: '2px',
            background: 'rgba(244, 71, 107, 0.15)',
            color: '#f48771',
            border: '1px solid rgba(244, 71, 107, 0.3)',
          }}
        >
          <Lock size={10} />
          <span>비공개</span>
        </span>
      );
    case 'PUBLIC':
    default:
      return (
        <span
          title="전체 공개 프로젝트"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.64rem',
            padding: '1px 5px',
            borderRadius: '2px',
            background: 'rgba(78, 201, 176, 0.12)',
            color: '#4ec9b0',
            border: '1px solid rgba(78, 201, 176, 0.25)',
          }}
        >
          <Globe size={10} />
          <span>공개</span>
        </span>
      );
  }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isAuthenticated,
  onSelectProject,
  onOpenDeleteConfirm,
  onToggleFavoriteSuccess,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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
            {renderVisibilityBadge(project.visibility)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FavoriteButton
              targetType="PROJECT"
              targetId={project.id}
              isFavorite={project.isFavorite}
              size="sm"
              onToggleSuccess={onToggleFavoriteSuccess}
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
