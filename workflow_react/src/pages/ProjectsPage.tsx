// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import type { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { useProjects, useDeleteProject } from '../api';
import { CustomFieldsModal } from '../components/CustomFieldsModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from '../components/ActionFeedbackModal';
import {
  ProjectsHeaderToolbar,
  ProjectsGrid,
} from '../components/projects';

interface ProjectsPageProps {
  onOpenCreateProject: () => void;
  onSelectProject: (projectId: number) => void;
  projects?: Project[];
  onProjectsChange?: (projects: Project[]) => void;
  onOpenAuth?: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onOpenCreateProject,
  onSelectProject,
  projects: externalProjects,
  onProjectsChange,
  onOpenAuth,
}) => {
  const { isAuthenticated } = useAuth();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  // TanStack Query로 프로젝트 목록 로드
  const { data: fetchedProjects = [], isLoading: loading } = useProjects();
  const deleteProjectMutation = useDeleteProject();

  const [isCustomFieldsModalOpen, setIsCustomFieldsModalOpen] = useState<boolean>(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const projects = externalProjects || fetchedProjects;

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    onOpenCreateProject();
  };

  const handleOpenDeleteConfirm = (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation();
    setDeletingProject(proj);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;

    await executeAction(
      async () => {
        return await deleteProjectMutation.mutateAsync(deletingProject.id);
      },
      {
        onSuccess: () => {
          if (onProjectsChange) {
            onProjectsChange(projects.filter((p) => p.id !== deletingProject.id));
          }
          setDeletingProject(null);
        },
      }
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 1. Header Toolbar */}
      <ProjectsHeaderToolbar
        projectsCount={projects.length}
        isAuthenticated={isAuthenticated}
        onOpenAuth={onOpenAuth}
        onOpenCustomFields={() => setIsCustomFieldsModalOpen(true)}
        onOpenCreateProject={handleCreateClick}
      />

      {/* 2. Projects Grid / Empty State */}
      <ProjectsGrid
        projects={projects}
        loading={loading}
        isAuthenticated={isAuthenticated}
        onSelectProject={onSelectProject}
        onOpenDeleteConfirm={handleOpenDeleteConfirm}
        onOpenCreateProject={handleCreateClick}
        onOpenAuth={onOpenAuth}
      />

      {/* 3. Modals */}
      <CustomFieldsModal
        isOpen={isCustomFieldsModalOpen}
        onClose={() => setIsCustomFieldsModalOpen(false)}
      />

      <ConfirmModal
        isOpen={!!deletingProject}
        title="프로젝트 삭제 확인"
        message={`'${deletingProject?.name}' (${deletingProject?.key}) 프로젝트를 정말 삭제하시겠습니까?`}
        confirmText="삭제"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingProject(null)}
        loading={isPending}
      />

      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </div>
  );
};