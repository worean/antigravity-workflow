import React, { useState, useEffect } from 'react';
import type { Project } from '../types';
import { getProjects, deleteProject } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Plus, Layers, Users, ArrowRight, Trash2, Sliders, Loader2 } from 'lucide-react';
import { CustomFieldsModal } from '../components/CustomFieldsModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from '../components/ActionFeedbackModal';

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

  const [internalProjects, setInternalProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCustomFieldsModalOpen, setIsCustomFieldsModalOpen] = useState<boolean>(false);

  // Deletion confirm modal state
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const projects = externalProjects || internalProjects;

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      if (onProjectsChange) {
        onProjectsChange(data);
      } else {
        setInternalProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenDeleteConfirm = (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation();
    setDeletingProject(proj);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;

    await executeAction(
      async () => {
        return await deleteProject(deletingProject.id);
      },
      {
        onSuccess: () => {
          const updated = projects.filter((p) => p.id !== deletingProject.id);
          if (onProjectsChange) {
            onProjectsChange(updated);
          } else {
            setInternalProjects(updated);
          }
          setDeletingProject(null);
        },
      }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>프로젝트 관리 (Projects)</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            등록된 워크스페이스 프로젝트를 관리하고, 커스텀 필드 및 관련 이슈를 확인합니다.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isAuthenticated && (
            <button className="btn btn-secondary" onClick={() => setIsCustomFieldsModalOpen(true)}>
              <Sliders size={16} /> 커스텀 필드 관리
            </button>
          )}
          {isAuthenticated && (
            <button className="btn btn-primary" onClick={onOpenCreateProject}>
              <Plus size={16} /> 신규 프로젝트 생성
            </button>
          )}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          프로젝트 정보를 불러오는 중...
        </div>
      ) : projects.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FolderKanban size={48} color="var(--text-muted)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>등록된 프로젝트가 없습니다.</h3>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            새로운 프로젝트를 추가하여 팀 과제 및 이슈 트래킹을 시작하세요.
          </p>
          {isAuthenticated && (
            <button className="btn btn-primary" onClick={onOpenCreateProject} style={{ marginTop: '8px' }}>
              <Plus size={16} /> 첫 프로젝트 만들기
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => onSelectProject(proj.id)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    KEY: {proj.key}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: #{proj.id}
                    </span>

                    {isAuthenticated && (
                      <button
                        onClick={(e) => handleOpenDeleteConfirm(e, proj)}
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.25)',
                          color: '#f43f5e',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="프로젝트 삭제"
                      >
                        <Trash2 size={13} /> 삭제
                      </button>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                  {proj.name}
                </h3>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-sub)',
                    marginBottom: '20px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {proj.description || '작성된 프로젝트 설명이 없습니다.'}
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={14} /> {proj._count?.issues ?? 0} 이슈
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} /> {proj._count?.memberships ?? 1} 멤버
                  </span>
                </div>

                <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                  이슈 목록 확인 <ArrowRight size={14} />
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
        message={`'${deletingProject?.name}' (${deletingProject?.key}) 프로젝트를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 포함된 모든 이슈 및 관련 데이터가 함께 삭제됩니다.`}
        confirmText="프로젝트 삭제"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingProject(null)}
        loading={isPending}
      />

      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </div>
  );
};
