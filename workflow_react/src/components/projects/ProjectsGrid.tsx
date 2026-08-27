// -*- coding: utf-8 -*-
import React from 'react';
import { FolderKanban, Plus, LogIn } from 'lucide-react';
import type { Project } from '../../types';
import { Button, Card, Spinner } from '../common';
import { ProjectCard } from './ProjectCard';

interface ProjectsGridProps {
  projects: Project[];
  loading: boolean;
  isAuthenticated: boolean;
  onSelectProject: (projectId: number) => void;
  onOpenDeleteConfirm: (e: React.MouseEvent, project: Project) => void;
  onOpenCreateProject: () => void;
  onOpenAuth?: () => void;
}

export const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  loading,
  isAuthenticated,
  onSelectProject,
  onOpenDeleteConfirm,
  onOpenCreateProject,
  onOpenAuth,
}) => {
  if (loading && projects.length === 0) {
    return <Spinner centered label="프로젝트 불러오는 중..." />;
  }

  if (projects.length === 0) {
    return (
      <Card
        variant="glass"
        padding="24px"
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <FolderKanban size={32} color="var(--text-muted)" />
        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
          {!isAuthenticated ? '로그인 후 프로젝트를 확인하거나 생성할 수 있습니다.' : '등록된 프로젝트가 없습니다.'}
        </div>
        {!isAuthenticated && onOpenAuth ? (
          <Button variant="primary" size="sm" icon={<LogIn size={12} />} onClick={onOpenAuth}>
            로그인하여 시작하기
          </Button>
        ) : (
          <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={onOpenCreateProject}>
            첫 프로젝트 생성
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '8px',
      }}
    >
      {projects.map((proj) => (
        <ProjectCard
          key={proj.id}
          project={proj}
          isAuthenticated={isAuthenticated}
          onSelectProject={onSelectProject}
          onOpenDeleteConfirm={onOpenDeleteConfirm}
          onOpenAuth={onOpenAuth}
        />
      ))}
    </div>
  );
};