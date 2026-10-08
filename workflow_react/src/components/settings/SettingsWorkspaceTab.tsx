﻿import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  getWorkspaceDetail,
  updateWorkspace,
  deleteWorkspace,
  removeWorkspaceMember,
  inviteWorkspaceMember,
  getWorkspaceInvitations,
  deleteWorkspaceInvitation,
  workspaceKeys,
} from '@/api/workspaces';
import { WorkspaceInviteModal, WorkspaceCreateModal } from '@/components/workspace';
import { AvatarCropModal } from '@/components/AvatarCropModal';
import type { WorkspaceRole } from '@/types';
import {
  WorkspaceSwitcherSection,
  WorkspaceProfileSection,
  WorkspaceMembersSection,
  WorkspaceInvitationsSection,
  WorkspaceDangerSection,
} from './workspace';

export const SettingsWorkspaceTab: React.FC = () => {
  const { currentWorkspace, switchWorkspace, workspaces, refetchWorkspaces } = useWorkspace();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // 1. 워크스페이스 상세 및 멤버 쿼리
  const {
    data: detail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: workspaceKeys.detail(currentWorkspace?.id || 0),
    queryFn: () => getWorkspaceDetail(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
  });

  // 2. 대기 중인 초대 목록 쿼리
  const {
    data: invitations = [],
    refetch: refetchInvitations,
  } = useQuery({
    queryKey: workspaceKeys.invitations(currentWorkspace?.id || 0),
    queryFn: () => getWorkspaceInvitations(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
  });

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('🏢');

  // Modals & Feedback
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // PNG 심볼 크롭 모달 관련 상태
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState<string>('');

  useEffect(() => {
    if (detail) {
      setEditName(detail.name);
      setEditDescription(detail.description || '');
      setEditIcon(detail.icon || '🏢');
    }
  }, [detail]);

  const isOwnerOrAdmin =
    user?.role === 'ADMIN' ||
    user?.email === 'worean@naver.com' ||
    currentWorkspace?.myRole === 'OWNER' ||
    currentWorkspace?.myRole === 'ADMIN';
  const isOwner = user?.role === 'ADMIN' || currentWorkspace?.myRole === 'OWNER';

  // 워크스페이스 정보 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string }) =>
      updateWorkspace(currentWorkspace!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      refetchWorkspaces();
      setIsEditing(false);
      setActionSuccess('워크스페이스 정보가 성공적으로 저장되었습니다.');
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error || err.message || '수정에 실패했습니다.');
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      icon: editIcon,
    });
  };

  const handleRoleChange = async (userId: number, newRole: WorkspaceRole) => {
    try {
      setActionError(null);
      await inviteWorkspaceMember(currentWorkspace!.id, { userId, role: newRole });
      refetchDetail();
      setActionSuccess('멤버 역할이 변경되었습니다.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '역할 변경에 실패했습니다.');
    }
  };

  const handleRemoveMember = async (userId: number, memberName: string) => {
    if (!window.confirm(`정말로 '${memberName}' 멤버를 워크스페이스에서 제외하시겠습니까?`)) return;

    try {
      setActionError(null);
      await removeWorkspaceMember(currentWorkspace!.id, userId);
      refetchDetail();
      setActionSuccess('멤버가 워크스페이스에서 제외되었습니다.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '멤버 제외에 실패했습니다.');
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/#/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeleteInvitation = async (invitationId: number) => {
    try {
      setActionError(null);
      await deleteWorkspaceInvitation(currentWorkspace!.id, invitationId);
      refetchInvitations();
      setActionSuccess('초대장이 취소되었습니다.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '초대 취소에 실패했습니다.');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (
      !window.confirm(
        `[위험] '${currentWorkspace?.name}' 워크스페이스와 연계된 모든 프로젝트, 일감, 채팅 및 물리 데이터베이스 파일이 영구 삭제됩니다.\n정말로 삭제하시겠습니까?`
      )
    )
      return;

    try {
      setActionError(null);
      await deleteWorkspace(currentWorkspace!.id);
      queryClient.invalidateQueries();
      const remainings = workspaces.filter((w) => w.id !== currentWorkspace?.id);
      if (remainings.length > 0) {
        switchWorkspace(remainings[0].id);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '워크스페이스 삭제에 실패했습니다.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px' }}>
      {/* Notifications */}
      {actionError && (
        <div
          style={{
            padding: '8px 12px',
            fontSize: '0.78rem',
            backgroundColor: 'rgba(241, 76, 76, 0.15)',
            border: '1px solid var(--accent-rose)',
            color: '#ff8080',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={14} />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div
          style={{
            padding: '8px 12px',
            fontSize: '0.78rem',
            backgroundColor: 'rgba(78, 201, 176, 0.15)',
            border: '1px solid var(--secondary)',
            color: 'var(--secondary)',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={14} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 1. 🏢 My Workspaces Switcher Grid */}
      <WorkspaceSwitcherSection
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        switchWorkspace={switchWorkspace}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* 2. ⚙️ Active Workspace Profile & Info */}
      <WorkspaceProfileSection
        currentWorkspace={currentWorkspace}
        detail={detail}
        isOwnerOrAdmin={isOwnerOrAdmin}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editName={editName}
        setEditName={setEditName}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editIcon={editIcon}
        setEditIcon={setEditIcon}
        handleUpdate={handleUpdate}
        isUpdating={updateMutation.isPending}
        onOpenCropModal={(src, fileName) => {
          setCropImageSrc(src);
          setCropFileName(fileName);
          setShowCropModal(true);
        }}
      />

      {/* 3. 👥 Workspace Members Table */}
      <WorkspaceMembersSection
        members={detail?.members || []}
        isOwnerOrAdmin={isOwnerOrAdmin}
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
      />

      {/* 4. 💌 Pending Invitations List */}
      {isOwnerOrAdmin && (
        <WorkspaceInvitationsSection
          invitations={invitations}
          copiedToken={copiedToken}
          onCopyInviteLink={handleCopyInviteLink}
          onDeleteInvitation={handleDeleteInvitation}
        />
      )}

      {/* 5. ⚠️ Danger Zone (Delete Workspace) */}
      {isOwner && <WorkspaceDangerSection onDeleteWorkspace={handleDeleteWorkspace} />}

      {/* Modals */}
      <WorkspaceInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          refetchDetail();
          refetchInvitations();
        }}
      />
      <WorkspaceCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          refetchWorkspaces();
        }}
      />

      {showCropModal && (
        <AvatarCropModal
          isOpen={showCropModal}
          imageSrc={cropImageSrc}
          fileName={cropFileName}
          onClose={() => setShowCropModal(false)}
          onCropComplete={(croppedPngDataUrl) => {
            setEditIcon(croppedPngDataUrl);
            setShowCropModal(false);
          }}
        />
      )}
    </div>
  );
};
