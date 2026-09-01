import React from 'react';
import {
  ArrowLeft,
  Columns,
  Layers,
  Clock,
  Edit3,
  Save,
  Trash2,
} from 'lucide-react';
import type { Project } from '@/types';
import { Button, FavoriteButton } from '@/components/common';

interface ProjectDetailHeaderProps {
  project: Project;
  onBack: () => void;
  onGoToBoard?: (projectId: number) => void;
  onGoToWBS?: (projectId: number) => void;
  onGoToSprints?: (projectId: number) => void;
  isPM: boolean;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handleSaveProject: () => Promise<void>;
  handleCancelEdit: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  onOpenAuth?: () => void;
}

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({
  project,
  onBack,
  onGoToBoard,
  onGoToWBS,
  onGoToSprints,
  isPM,
  isEditing,
  setIsEditing,
  handleSaveProject,
  handleCancelEdit,
  setShowDeleteConfirm,
  setProject,
  onOpenAuth,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        flexShrink: 0,
      }}
    >
      {/* Left: Back & Project Key/Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '28px' }}
        >
          <ArrowLeft size={13} /> 목록으로
        </Button>

        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(0, 122, 204, 0.15)',
            color: 'var(--accent-cyan)',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          {project.key}
        </span>

        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          {project.name}
        </span>

        <FavoriteButton
          targetType="PROJECT"
          targetId={project.id}
          isFavorite={project.isFavorite}
          size="md"
          onOpenAuth={onOpenAuth}
          onToggleSuccess={(isFav) => {
            setProject((prev) => (prev ? { ...prev, isFavorite: isFav } : prev));
          }}
        />
      </div>

      {/* Right: Quick Links & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onGoToBoard && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onGoToBoard(project.id)}
            style={{ height: '28px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Columns size={13} /> 칸반 보드 열기
          </Button>
        )}

        {onGoToWBS && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onGoToWBS(project.id)}
            style={{ height: '28px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Layers size={13} /> WBS 간트 차트
          </Button>
        )}

        {onGoToSprints && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onGoToSprints(project.id)}
            style={{ height: '28px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Clock size={13} /> 스프린트 백로그
          </Button>
        )}

        {isPM && (
          <>
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveProject}
                  style={{ height: '28px', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
                >
                  <Save size={13} style={{ marginRight: '4px' }} /> 변경사항 저장
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelEdit}
                  style={{ height: '28px', fontSize: '0.75rem' }}
                >
                  취소
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                style={{ height: '28px', fontSize: '0.75rem' }}
              >
                <Edit3 size={13} style={{ marginRight: '4px' }} /> 프로젝트 수정
              </Button>
            )}

            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ height: '28px', fontSize: '0.75rem' }}
              title="프로젝트 삭제"
            >
              <Trash2 size={13} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};