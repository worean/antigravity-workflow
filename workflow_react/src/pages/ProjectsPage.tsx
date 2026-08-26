import React, { useState } from 'react';
import type { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { useProjects, useDeleteProject } from '../api';
import { FolderKanban, Plus, Layers, Users, ArrowRight, Trash2, Sliders, Folder } from 'lucide-react';
import { CustomFieldsModal } from '../components/CustomFieldsModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from '../components/ActionFeedbackModal';
import { Button, Card, Spinner } from '../components/common';

interface ProjectsPageProps {
  onOpenCreateProject: () => void;
  onSelectProject: (projectId: number) => void;
  projects?: Project[];
  onProjectsChange?: (projects: Project[]) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onOpenCreateProject,
  onSelectProject,
  projects: externalProjects,
  onProjectsChange,
}) => {
  const { isAuthenticated } = useAuth();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  // TanStack Query로 프로젝트 목록 로드
  const { data: fetchedProjects = [], isLoading: loading } = useProjects();
  const deleteProjectMutation = useDeleteProject();

  const [isCustomFieldsModalOpen, setIsCustomFieldsModalOpen] = useState<boolean>(false);

  // Deletion confirm modal state
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const projects = externalProjects || fetchedProjects;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header Toolbar (Compact) */}
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
            프로젝트 관리 ({projects.length})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {isAuthenticated && (
            <Button variant="secondary" size="sm" icon={<Sliders size={12} />} onClick={() => setIsCustomFieldsModalOpen(true)}>
              커스텀 필드
            </Button>
          )}
          {isAuthenticated && (
            <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={onOpenCreateProject}>
              프로젝트 생성
            </Button>
          )}
        </div>
      </div>

      {/* Grid List (High Density) */}
      {loading && projects.length === 0 ? (
        <Spinner centered label="프로젝트 불러오는 중..." />
      ) : projects.length === 0 ? (
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
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>등록된 프로젝트가 없습니다.</div>
          {isAuthenticated && (
            <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={onOpenCreateProject}>
              첫 프로젝트 생성
            </Button>
          )}
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '8px',
          }}
        >
          {projects.map((proj) => (
            <div
              key={proj.id}
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
              onClick={() => onSelectProject(proj.id)}
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
                    {proj.key}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      #{proj.id}
                    </span>

                    {isAuthenticated && (
                      <button
                        onClick={(e) => handleOpenDeleteConfirm(e, proj)}
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
                  {proj.name}
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
                  {proj.description || '설명 없음'}
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
                    <Layers size={11} /> {proj._count?.issues ?? 0} 이슈
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Users size={11} /> {proj._count?.members ?? (proj.members?.length ?? 1)} 멤버
                  </span>
                </div>

                <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 500 }}>
                  열기 <ArrowRight size={11} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Fields Manager Modal */}
      <CustomFieldsModal
        isOpen={isCustomFieldsModalOpen}
        onClose={() => setIsCustomFieldsModalOpen(false)}
      />

      {/* Project Delete Confirmation Modal */}
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
