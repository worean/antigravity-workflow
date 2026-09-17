import React, { useState } from 'react';
import type { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useProjects, useDeleteProject } from '@/api';
import { useUIStore } from '@/stores/useUIStore';
import { CustomFieldsModal } from '@/components/CustomFieldsModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import {
  ProjectsHeaderToolbar,
  ProjectsGrid,
} from '@/components/projects';
import type { VisibilityFilterType } from '@/components/projects/ProjectsHeaderToolbar';

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

  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityFilterType>('ALL');

  // TanStack Query로 프로젝트 목록 로드 (공개 범위 필터 연동 - Single Source of Truth)
  const queryParams = selectedVisibility === 'ALL' ? undefined : { visibility: selectedVisibility };
  const { data: fetchedProjects = [], isLoading: loading } = useProjects(queryParams);
  const deleteProjectMutation = useDeleteProject();

  const [isCustomFieldsModalOpen, setIsCustomFieldsModalOpen] = useState<boolean>(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const openProjectModal = useUIStore((s) => s.openProjectModal);

  // externalProjects가 명시적으로 배열로 주어지고 비어있지 않은 경우에만 사용, 그 외는 서버 데이터(fetchedProjects)가 단일 진실 공급원
  const rawProjects =
    externalProjects && externalProjects.length > 0
      ? externalProjects
      : fetchedProjects;

  const projects =
    selectedVisibility === 'ALL'
      ? rawProjects
      : rawProjects.filter((p) => (p.visibility || 'PUBLIC') === selectedVisibility);

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (onOpenCreateProject) {
      onOpenCreateProject();
    } else {
      openProjectModal();
    }
  };

  const handleOpenDeleteConfirm = (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation();
    setDeletingProject(proj);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    const target = deletingProject;

    await executeAction(
      async () => {
        return await deleteProjectMutation.mutateAsync(target.id);
      },
      {
        onSuccess: () => {
          useUIStore.getState().showToast(`'${target.name}' (${target.key}) 프로젝트가 성공적으로 삭제되었습니다.`, 'success');
          if (onProjectsChange) {
            onProjectsChange(projects.filter((p) => p.id !== target.id));
          }
          setDeletingProject(null);
        },
        onError: (err) => {
          useUIStore.getState().showToast(err.response?.data?.error || `'${target.name}' 프로젝트 삭제에 실패했습니다.`, 'error');
        },
      }
    );
  };

  const handleFavoriteToggleSuccess = (isFav: boolean, proj: Project) => {
    useUIStore.getState().showToast(
      isFav
        ? `'${proj.name}' 즐겨찾기에 추가되었습니다.`
        : `'${proj.name}' 즐겨찾기에서 해제되었습니다.`,
      'success'
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 1. Header Toolbar */}
      <ProjectsHeaderToolbar
        projectsCount={projects.length}
        isAuthenticated={isAuthenticated}
        selectedVisibility={selectedVisibility}
        onChangeVisibility={setSelectedVisibility}
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
        onToggleFavoriteSuccess={handleFavoriteToggleSuccess}
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
