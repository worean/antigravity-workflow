// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import type { Project, User, Group } from '@/types';
import {
  getProject,
  updateProject,
  deleteProject,
  getUsers,
  getGroups,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  addProjectGroup,
  removeProjectGroup,
  updateProjectGroupRole,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { Button, Spinner } from '@/components/common';
import { formatDateOnly } from '@/utils/dateUtils';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  ProjectDetailHeader,
  ProjectInfoCard,
  ProjectParticipationSection,
  ProjectSidebar,
} from '@/components/projectDetail';

interface ProjectDetailPageProps {
  projectId: number;
  onBack: () => void;
  onGoToBoard?: (projectId: number) => void;
  onGoToWBS?: (projectId: number) => void;
  onGoToSprints?: (projectId: number) => void;
  onProjectUpdated?: (project: Project) => void;
  onProjectDeleted?: (projectId: number) => void;
  onOpenAuth?: () => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  onBack,
  onGoToBoard,
  onGoToWBS,
  onGoToSprints,
  onProjectUpdated,
  onProjectDeleted,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { errorState, closeErrorModal, executeAction } = useActionFeedback();

  const [project, setProject] = useState<Project | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editKey, setEditKey] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editStatusId, setEditStatusId] = useState<number>(1);
  const [editPriorityId, setEditPriorityId] = useState<number>(1);
  const [editPlannedStartDate, setEditPlannedStartDate] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editActualStartDate, setEditActualStartDate] = useState<string>('');
  const [editActualEndDate, setEditActualEndDate] = useState<string>('');

  // Sub-Tab State: 'members' | 'groups'
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'groups'>('members');

  // Modals State
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<number | ''>('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<string>('MEMBER');

  const [showAddGroupModal, setShowAddGroupModal] = useState<boolean>(false);
  const [selectedGroupIdToAdd, setSelectedGroupIdToAdd] = useState<number | ''>('');
  const [selectedGroupRole, setSelectedGroupRole] = useState<string>('MEMBER');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Load Project and Metadata
  const loadProjectData = async () => {
    setLoading(true);
    try {
      const [projData, usersData, groupsData] = await Promise.all([
        getProject(projectId),
        getUsers(),
        getGroups(false),
      ]);
      setProject(projData);
      setAllUsers(usersData || []);
      setAllGroups(groupsData || []);

      setEditName(projData.name || '');
      setEditKey(projData.key || '');
      setEditDescription(projData.description || '');
      setEditStatusId(projData.statusId || 1);
      setEditPriorityId(projData.priorityId || 1);
      setEditPlannedStartDate(formatDateOnly(projData.plannedStartDate) || '');
      setEditDueDate(formatDateOnly(projData.dueDate) || '');
      setEditActualStartDate(formatDateOnly(projData.actualStartDate) || '');
      setEditActualEndDate(formatDateOnly(projData.actualEndDate) || '');
    } catch (err: any) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const isPM = project?.ownerId === user?.id || user?.role === 'ADMIN';

  const handleSaveProject = async () => {
    if (!project) return;
    if (!editName.trim()) return alert('프로젝트 이름을 입력해주세요.');
    if (!editKey.trim()) return alert('프로젝트 식별 키를 입력해주세요.');

    await executeAction(
      async () => {
        return await updateProject(project.id, {
          name: editName.trim(),
          key: editKey.trim().toUpperCase(),
          description: editDescription,
          statusId: editStatusId,
          priorityId: editPriorityId,
          plannedStartDate: editPlannedStartDate || null,
          dueDate: editDueDate || null,
          actualStartDate: editActualStartDate || null,
          actualEndDate: editActualEndDate || null,
        });
      },
      {
        onSuccess: (updated) => {
          setProject(updated);
          setIsEditing(false);
          if (onProjectUpdated) onProjectUpdated(updated);
        },
      }
    );
  };

  const handleCancelEdit = () => {
    if (!project) return;
    setIsEditing(false);
    setEditName(project.name || '');
    setEditKey(project.key || '');
    setEditDescription(project.description || '');
    setEditStatusId(project.statusId || 1);
    setEditPriorityId(project.priorityId || 1);
    setEditPlannedStartDate(formatDateOnly(project.plannedStartDate) || '');
    setEditDueDate(formatDateOnly(project.dueDate) || '');
    setEditActualStartDate(formatDateOnly(project.actualStartDate) || '');
    setEditActualEndDate(formatDateOnly(project.actualEndDate) || '');
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    await executeAction(
      async () => {
        await deleteProject(project.id);
        return project.id;
      },
      {
        onSuccess: (pId) => {
          setShowDeleteConfirm(false);
          if (onProjectDeleted) onProjectDeleted(pId);
          onBack();
        },
      }
    );
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedUserIdToAdd) return;

    await executeAction(
      async () => {
        return await addProjectMember(project.id, Number(selectedUserIdToAdd), selectedMemberRole);
      },
      {
        onSuccess: (newMember) => {
          setShowAddMemberModal(false);
          setSelectedUserIdToAdd('');
          setSelectedMemberRole('MEMBER');
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  members: [...(prev.members || []), newMember],
                }
              : null
          );
        },
      }
    );
  };

  const handleUpdateMemberRole = async (userId: number, role: string) => {
    if (!project) return;
    await executeAction(
      async () => {
        return await updateProjectMemberRole(project.id, userId, role);
      },
      {
        onSuccess: () => {
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  members: (prev.members || []).map((m) =>
                    m.userId === userId ? { ...m, role } : m
                  ),
                }
              : null
          );
        },
      }
    );
  };

  const handleRemoveMember = async (userId: number) => {
    if (!project) return;
    const target = project.members?.find((m) => m.userId === userId);
    const targetName = target?.user?.name || target?.user?.email || '멤버';

    if (!confirm(`'${targetName}' 사용자를 프로젝트에서 제외하시겠습니까?`)) return;

    await executeAction(
      async () => {
        await removeProjectMember(project.id, userId);
      },
      {
        onSuccess: () => {
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  members: (prev.members || []).filter((m) => m.userId !== userId),
                }
              : null
          );
        },
      }
    );
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedGroupIdToAdd) return;

    await executeAction(
      async () => {
        return await addProjectGroup(project.id, Number(selectedGroupIdToAdd), selectedGroupRole);
      },
      {
        onSuccess: (newGroup) => {
          setShowAddGroupModal(false);
          setSelectedGroupIdToAdd('');
          setSelectedGroupRole('MEMBER');
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  groups: [...(prev.groups || []), newGroup],
                }
              : null
          );
        },
      }
    );
  };

  const handleUpdateGroupRole = async (groupId: number, role: string) => {
    if (!project) return;
    await executeAction(
      async () => {
        return await updateProjectGroupRole(project.id, groupId, role);
      },
      {
        onSuccess: () => {
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  groups: (prev.groups || []).map((g) =>
                    g.groupId === groupId ? { ...g, role } : g
                  ),
                }
              : null
          );
        },
      }
    );
  };

  const handleRemoveGroup = async (groupId: number) => {
    if (!project) return;
    const target = project.groups?.find((g) => g.groupId === groupId);
    const targetName = target?.group?.name || '그룹';

    if (!confirm(`'${targetName}' 조직 그룹을 프로젝트에서 제외하시겠습니까?`)) return;

    await executeAction(
      async () => {
        await removeProjectGroup(project.id, groupId);
      },
      {
        onSuccess: () => {
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  groups: (prev.groups || []).filter((g) => g.groupId !== groupId),
                }
              : null
          );
        },
      }
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spinner centered label="프로젝트 정보를 불러오는 중입니다..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <AlertCircle size={36} color="var(--danger)" style={{ marginBottom: '12px' }} />
        <div>프로젝트를 찾을 수 없거나 접근 권한이 없습니다.</div>
        <Button variant="secondary" onClick={onBack} style={{ marginTop: '16px' }}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', gap: '8px' }}>
      {/* 1. Top Navigation Toolbar */}
      <ProjectDetailHeader
        project={project}
        onBack={onBack}
        onGoToBoard={onGoToBoard}
        onGoToWBS={onGoToWBS}
        onGoToSprints={onGoToSprints}
        isPM={isPM}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        handleSaveProject={handleSaveProject}
        handleCancelEdit={handleCancelEdit}
        setShowDeleteConfirm={setShowDeleteConfirm}
        setProject={setProject}
        onOpenAuth={onOpenAuth}
      />

      {/* 2. Main Content 2-Column Split */}
      <div style={{ flex: 1, display: 'flex', gap: '8px', overflow: 'hidden' }}>
        {/* Left Column: Info Card + Participation Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingRight: '4px' }}>
          <ProjectInfoCard
            project={project}
            isEditing={isEditing}
            editName={editName}
            setEditName={setEditName}
            editKey={editKey}
            setEditKey={setEditKey}
            editDescription={editDescription}
            setEditDescription={setEditDescription}
          />

          <ProjectParticipationSection
            project={project}
            allUsers={allUsers}
            allGroups={allGroups}
            isPM={isPM}
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            handleUpdateMemberRole={handleUpdateMemberRole}
            handleRemoveMember={handleRemoveMember}
            showAddMemberModal={showAddMemberModal}
            setShowAddMemberModal={setShowAddMemberModal}
            selectedUserIdToAdd={selectedUserIdToAdd}
            setSelectedUserIdToAdd={setSelectedUserIdToAdd}
            selectedMemberRole={selectedMemberRole}
            setSelectedMemberRole={setSelectedMemberRole}
            handleAddMember={handleAddMember}
            handleUpdateGroupRole={handleUpdateGroupRole}
            handleRemoveGroup={handleRemoveGroup}
            showAddGroupModal={showAddGroupModal}
            setShowAddGroupModal={setShowAddGroupModal}
            selectedGroupIdToAdd={selectedGroupIdToAdd}
            setSelectedGroupIdToAdd={setSelectedGroupIdToAdd}
            selectedGroupRole={selectedGroupRole}
            setSelectedGroupRole={setSelectedGroupRole}
            handleAddGroup={handleAddGroup}
          />
        </div>

        {/* Right Column: Metadata Sidebar */}
        <ProjectSidebar
          project={project}
          isEditing={isEditing}
          editStatusId={editStatusId}
          setEditStatusId={setEditStatusId}
          editPriorityId={editPriorityId}
          setEditPriorityId={setEditPriorityId}
          editPlannedStartDate={editPlannedStartDate}
          setEditPlannedStartDate={setEditPlannedStartDate}
          editDueDate={editDueDate}
          setEditDueDate={setEditDueDate}
          editActualStartDate={editActualStartDate}
          setEditActualStartDate={setEditActualStartDate}
          editActualEndDate={editActualEndDate}
          setEditActualEndDate={setEditActualEndDate}
        />
      </div>

      {/* 3. Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="프로젝트 삭제"
          message={`정말로 '${project.name}' 프로젝트를 삭제하시겠습니까? 관련된 모든 이슈, 스프린트, 마일스톤 데이터가 함께 삭제됩니다.`}
          confirmText="삭제"
          onConfirm={handleDeleteProject}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* 4. Feedback Modal */}
      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </div>
  );
};