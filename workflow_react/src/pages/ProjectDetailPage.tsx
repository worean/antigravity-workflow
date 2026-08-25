// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import type { Project, User, Group } from '../types';
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
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Columns,
  Layers,
  Clock,
  Edit3,
  Save,
  Trash2,
  UserPlus,
  Users,
  Building2,
  AlertCircle,
  Crown,
  X,
} from 'lucide-react';
import { Button, Spinner, Avatar, MarkdownViewer, MarkdownEditor, StatusBadge, PriorityBadge } from '../components/common';
import { formatDateOnly, getDDayStatus } from '../utils/dateUtils';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from '../components/ActionFeedbackModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface ProjectDetailPageProps {
  projectId: number;
  onBack: () => void;
  onGoToBoard?: (projectId: number) => void;
  onGoToWBS?: (projectId: number) => void;
  onGoToSprints?: (projectId: number) => void;
  onProjectUpdated?: (project: Project) => void;
  onProjectDeleted?: (projectId: number) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  onBack,
  onGoToBoard,
  onGoToWBS,
  onGoToSprints,
  onProjectUpdated,
  onProjectDeleted,
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
        getGroups(false), // Flat list for select dropdowns
      ]);
      setProject(projData);
      setAllUsers(usersData || []);
      setAllGroups(groupsData || []);

      // Initialize edit fields
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

  // Is Current User Project PM / Owner or Admin
  const isPM = project?.ownerId === user?.id || user?.role === 'ADMIN';

  // Save Project Changes
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

  // Delete Project
  const handleDeleteProject = async () => {
    if (!project) return;
    await executeAction(
      async () => {
        await deleteProject(project.id);
      },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          if (onProjectDeleted) onProjectDeleted(project.id);
          onBack();
        },
      }
    );
  };

  // Member Management Handlers
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedUserIdToAdd) return;

    await executeAction(
      async () => {
        return await addProjectMember(project.id, Number(selectedUserIdToAdd), selectedMemberRole);
      },
      {
        onSuccess: (newMember) => {
          setProject((prev) =>
            prev ? { ...prev, members: [...(prev.members || []), newMember] } : null
          );
          setShowAddMemberModal(false);
          setSelectedUserIdToAdd('');
          setSelectedMemberRole('MEMBER');
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
        onSuccess: (updatedMember) => {
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  members: (prev.members || []).map((m) =>
                    m.userId === userId ? { ...m, role: updatedMember.role } : m
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
    if (!confirm('이 멤버를 프로젝트에서 제외하시겠습니까?')) return;

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

  // Group Management Handlers
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedGroupIdToAdd) return;

    await executeAction(
      async () => {
        return await addProjectGroup(project.id, Number(selectedGroupIdToAdd), selectedGroupRole);
      },
      {
        onSuccess: (newGroup) => {
          setProject((prev) =>
            prev ? { ...prev, groups: [...(prev.groups || []), newGroup] } : null
          );
          setShowAddGroupModal(false);
          setSelectedGroupIdToAdd('');
          setSelectedGroupRole('MEMBER');
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
        onSuccess: (updatedGroup) => {
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  groups: (prev.groups || []).map((g) =>
                    g.groupId === groupId ? { ...g, role: updatedGroup.role } : g
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
    if (!confirm('이 그룹을 프로젝트 참여 그룹에서 제외하시겠습니까?')) return;

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

  const dDay = getDDayStatus(project.dueDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', gap: '8px' }}>
      {/* 🧭 Top Navigation Toolbar */}
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
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(project.name || '');
                      setEditKey(project.key || '');
                      setEditDescription(project.description || '');
                    }}
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

      {/* 📄 Main Content 2-Column Split */}
      <div style={{ flex: 1, display: 'flex', gap: '8px', overflow: 'hidden' }}>
        {/* Left Main */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {/* 1. Basic Info Card */}
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                      프로젝트 이름 *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="프로젝트 이름을 입력하세요"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ width: '140px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                      식별 키 (Key) *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={editKey}
                      onChange={(e) => setEditKey(e.target.value.toUpperCase())}
                      placeholder="KEY"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                    프로젝트 설명 및 개요
                  </label>
                  <MarkdownEditor
                    value={editDescription}
                    onChange={setEditDescription}
                    placeholder="프로젝트의 목적, 목표 및 범위를 마크다운으로 작성하세요..."
                    minHeight="140px"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
                    {project.name}
                  </h2>
                </div>
                {project.description ? (
                  <MarkdownViewer content={project.description} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    등록된 프로젝트 설명이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Members & Groups Participation Management */}
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Header with Sub-Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('members')}
                  style={{
                    background: activeSubTab === 'members' ? 'rgba(0, 122, 204, 0.2)' : 'transparent',
                    color: activeSubTab === 'members' ? '#9cdcfe' : 'var(--text-muted)',
                    border: activeSubTab === 'members' ? '1px solid #007acc' : '1px solid transparent',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Users size={13} />
                  <span>개인 멤버 ({project.members?.length || 0}명)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('groups')}
                  style={{
                    background: activeSubTab === 'groups' ? 'rgba(0, 122, 204, 0.2)' : 'transparent',
                    color: activeSubTab === 'groups' ? '#9cdcfe' : 'var(--text-muted)',
                    border: activeSubTab === 'groups' ? '1px solid #007acc' : '1px solid transparent',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Building2 size={13} />
                  <span>참여 그룹 ({project.groups?.length || 0}팀)</span>
                </button>
              </div>

              {isPM && (
                <div>
                  {activeSubTab === 'members' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddMemberModal(true)}
                      style={{ fontSize: '0.75rem', height: '26px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <UserPlus size={12} /> 개인 멤버 추가
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddGroupModal(true)}
                      style={{ fontSize: '0.75rem', height: '26px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Building2 size={12} /> 참여 그룹 추가
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* SubTab: Members */}
            {activeSubTab === 'members' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(!project.members || project.members.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    등록된 프로젝트 멤버가 없습니다.
                  </div>
                ) : (
                  project.members.map((m) => {
                    const isOwner = project.ownerId === m.userId;
                    return (
                      <div
                        key={m.id || m.userId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#252526',
                          border: '1px solid #333333',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar user={m.user} name={m.user?.name || ''} size={28} shape="circle" />
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{m.user?.name || '익명 사용자'}</span>
                              {isOwner && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '1px 5px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Crown size={10} /> 프로젝트 소유자
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {m.user?.email}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isPM && !isOwner ? (
                            <select
                              className="input-field"
                              value={m.role}
                              onChange={(e) => handleUpdateMemberRole(m.userId, e.target.value)}
                              style={{ width: '95px', height: '24px', fontSize: '0.72rem', padding: '0 4px' }}
                            >
                              <option value="ADMIN">관리자 (ADMIN)</option>
                              <option value="MEMBER">멤버 (MEMBER)</option>
                              <option value="VIEWER">뷰어 (VIEWER)</option>
                            </select>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '3px',
                                background: m.role === 'ADMIN' ? 'rgba(0,122,204,0.2)' : 'rgba(255,255,255,0.06)',
                                color: m.role === 'ADMIN' ? '#9cdcfe' : 'var(--text-sub)',
                                fontWeight: 600,
                              }}
                            >
                              {m.role}
                            </span>
                          )}

                          {isPM && !isOwner && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.userId)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#f43f5e',
                                cursor: 'pointer',
                                padding: '3px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="멤버 제외"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* SubTab: Groups */}
            {activeSubTab === 'groups' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  💡 그룹 참여 시 해당 그룹의 모든 구성원이 프로젝트에 권한을 부여받으며, 개인 멤버와의 중복 참여도 허용됩니다.
                </div>

                {(!project.groups || project.groups.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    참여 중인 조직 그룹이 없습니다.
                  </div>
                ) : (
                  project.groups.map((g) => (
                    <div
                      key={g.id || g.groupId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#252526',
                        border: '1px solid #333333',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '4px',
                            background: 'rgba(78, 201, 176, 0.15)',
                            color: '#4ec9b0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{g.group?.name}</span>
                            {g.group?.code && (
                              <span style={{ fontSize: '0.65rem', background: '#333', color: 'var(--text-sub)', padding: '1px 5px', borderRadius: '3px' }}>
                                {g.group.code}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {g.group?.parent ? `${g.group.parent.name} 하위 · ` : ''}
                            {g.group?.members ? `구성원 ${g.group.members.length}명` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isPM ? (
                          <select
                            className="input-field"
                            value={g.role}
                            onChange={(e) => handleUpdateGroupRole(g.groupId, e.target.value)}
                            style={{ width: '95px', height: '24px', fontSize: '0.72rem', padding: '0 4px' }}
                          >
                            <option value="ADMIN">관리자 (ADMIN)</option>
                            <option value="MEMBER">멤버 (MEMBER)</option>
                            <option value="VIEWER">뷰어 (VIEWER)</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              background: 'rgba(78, 201, 176, 0.15)',
                              color: '#4ec9b0',
                              fontWeight: 600,
                            }}
                          >
                            {g.role}
                          </span>
                        )}

                        {isPM && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGroup(g.groupId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f43f5e',
                              cursor: 'pointer',
                              padding: '3px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="그룹 제외"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div
          style={{
            width: '320px',
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
          }}
        >
          {/* Metadata Card */}
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-bright)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              프로젝트 정보
            </div>

            {/* Owner */}
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>프로젝트 소유자 (Owner / PM)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar user={project.owner} name={project.owner?.name || ''} size={22} shape="circle" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-bright)', fontWeight: 500 }}>
                  {project.owner?.name || '미지정'}
                </span>
              </div>
            </div>

            {/* Status & Priority */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>상태</div>
                {isEditing ? (
                  <select
                    className="input-field"
                    value={editStatusId}
                    onChange={(e) => setEditStatusId(Number(e.target.value))}
                    style={{ width: '100%', height: '26px', fontSize: '0.75rem' }}
                  >
                    <option value={1}>준비 / 대기 (TODO)</option>
                    <option value={2}>진행 중 (IN_PROGRESS)</option>
                    <option value={3}>완료 (DONE)</option>
                  </select>
                ) : (
                  <StatusBadge status={project.status} size="md" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>우선순위</div>
                {isEditing ? (
                  <select
                    className="input-field"
                    value={editPriorityId}
                    onChange={(e) => setEditPriorityId(Number(e.target.value))}
                    style={{ width: '100%', height: '26px', fontSize: '0.75rem' }}
                  >
                    <option value={1}>낮음 (Low)</option>
                    <option value={2}>보통 (Medium)</option>
                    <option value={3}>높음 (High)</option>
                    <option value={4}>긴급 (Critical)</option>
                  </select>
                ) : (
                  <PriorityBadge priority={project.priority} size="md" />
                )}
              </div>
            </div>

            {/* Dates Section */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                일정 및 기한 관리
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      시작 계획일
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={editPlannedStartDate}
                      onChange={(e) => setEditPlannedStartDate(e.target.value)}
                      style={{ width: '100%', fontSize: '0.75rem', height: '26px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      완료 기한일
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      style={{ width: '100%', fontSize: '0.75rem', height: '26px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      실제 시작일
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={editActualStartDate}
                      onChange={(e) => setEditActualStartDate(e.target.value)}
                      style={{ width: '100%', fontSize: '0.75rem', height: '26px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      실제 종료일
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={editActualEndDate}
                      onChange={(e) => setEditActualEndDate(e.target.value)}
                      style={{ width: '100%', fontSize: '0.75rem', height: '26px' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>시작 계획:</span>
                    <span style={{ color: 'var(--text-bright)' }}>{formatDateOnly(project.plannedStartDate) || '미설정'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>완료 기한:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--text-bright)' }}>{formatDateOnly(project.dueDate) || '미설정'}</span>
                      {dDay && (
                        <span style={{ fontSize: '0.62rem', color: dDay.color, background: dDay.bg, padding: '1px 4px', borderRadius: '2px' }}>
                          {dDay.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>실제 기간:</span>
                    <span style={{ color: 'var(--text-sub)' }}>
                      {formatDateOnly(project.actualStartDate) || '-'} ~ {formatDateOnly(project.actualEndDate) || '-'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Created / Updated timestamps */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <div>생성일: {formatDateOnly(project.createdAt)}</div>
              <div>최종 수정: {formatDateOnly(project.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ➕ Modal: Add Member */}
      {showAddMemberModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '380px',
              background: '#252526',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                개인 멤버 추가
              </div>
              <button onClick={() => setShowAddMemberModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                  추가할 사용자 선택 *
                </label>
                <select
                  className="input-field"
                  value={selectedUserIdToAdd}
                  onChange={(e) => setSelectedUserIdToAdd(Number(e.target.value))}
                  required
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <option value="">사용자를 선택하세요...</option>
                  {allUsers
                    .filter((u) => !project.members?.some((m) => m.userId === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || '익명'} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                  역할 (Role)
                </label>
                <select
                  className="input-field"
                  value={selectedMemberRole}
                  onChange={(e) => setSelectedMemberRole(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <option value="MEMBER">멤버 (MEMBER) - 기본</option>
                  <option value="ADMIN">관리자 (ADMIN)</option>
                  <option value="VIEWER">뷰어 (VIEWER)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddMemberModal(false)}>
                  취소
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={!selectedUserIdToAdd}>
                  추가하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ➕ Modal: Add Group */}
      {showAddGroupModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '380px',
              background: '#252526',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                참여 그룹 추가
              </div>
              <button onClick={() => setShowAddGroupModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddGroup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                  추가할 조직 그룹 선택 *
                </label>
                <select
                  className="input-field"
                  value={selectedGroupIdToAdd}
                  onChange={(e) => setSelectedGroupIdToAdd(Number(e.target.value))}
                  required
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <option value="">조직 그룹을 선택하세요...</option>
                  {allGroups
                    .filter((g) => !project.groups?.some((pg) => pg.groupId === g.id))
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} {g.code ? `(${g.code})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                  그룹 기본 역할 (Role)
                </label>
                <select
                  className="input-field"
                  value={selectedGroupRole}
                  onChange={(e) => setSelectedGroupRole(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <option value="MEMBER">멤버 (MEMBER) - 기본</option>
                  <option value="ADMIN">관리자 (ADMIN)</option>
                  <option value="VIEWER">뷰어 (VIEWER)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddGroupModal(false)}>
                  취소
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={!selectedGroupIdToAdd}>
                  추가하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ Modal: Delete Confirmation */}
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

      {/* Feedback Modal */}
      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </div>
  );
};