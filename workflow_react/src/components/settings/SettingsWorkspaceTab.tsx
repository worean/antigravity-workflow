// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, UserPlus, Trash2, Edit2, Check, UserMinus, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  getWorkspaceDetail,
  updateWorkspace,
  deleteWorkspace,
  removeWorkspaceMember,
  inviteWorkspaceMember,
  workspaceKeys,
} from '@/api/workspaces';
import { Avatar } from '@/components/common';
import { WorkspaceInviteModal } from '@/components/workspace';
import type { WorkspaceRole } from '@/types';

const DEFAULT_ICONS = ['🚀', '🏢', '⚡', '🌟', '💻', '🎯', '🔥', '🛡️'];

export const SettingsWorkspaceTab: React.FC = () => {
  const { currentWorkspace, switchWorkspace, workspaces } = useWorkspace();
  const queryClient = useQueryClient();

  // Detail & Members Query
  const {
    data: detail,
    refetch,
  } = useQuery({
    queryKey: workspaceKeys.detail(currentWorkspace?.id || 0),
    queryFn: () => getWorkspaceDetail(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
  });

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('🏢');

  // Modals & Feedback
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (detail) {
      setEditName(detail.name);
      setEditDescription(detail.description || '');
      setEditIcon(detail.icon || '🏢');
    }
  }, [detail]);

  const isOwnerOrAdmin = currentWorkspace?.myRole === 'OWNER' || currentWorkspace?.myRole === 'ADMIN';
  const isOwner = currentWorkspace?.myRole === 'OWNER';

  // 1. 워크스페이스 정보 수정
  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string }) =>
      updateWorkspace(currentWorkspace!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      setIsEditing(false);
      setActionSuccess('워크스페이스 정보가 성공적으로 수정되었습니다.');
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

  // 2. 멤버 역할 변경
  const handleRoleChange = async (userId: number, newRole: WorkspaceRole) => {
    try {
      setActionError(null);
      await inviteWorkspaceMember(currentWorkspace!.id, { userId, role: newRole });
      refetch();
      setActionSuccess('멤버 권한이 변경되었습니다.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '권한 변경에 실패했습니다.');
    }
  };

  // 3. 멤버 제거/추방
  const handleRemoveMember = async (userId: number, memberName: string) => {
    if (!window.confirm(`정말로 '${memberName}' 멤버를 워크스페이스에서 제외하시겠습니까?`)) return;

    try {
      setActionError(null);
      await removeWorkspaceMember(currentWorkspace!.id, userId);
      refetch();
      setActionSuccess('멤버가 워크스페이스에서 제외되었습니다.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '멤버 제외에 실패했습니다.');
    }
  };

  // 4. 워크스페이스 삭제
  const handleDeleteWorkspace = async () => {
    if (
      !window.confirm(
        `[경고] '${currentWorkspace?.name}' 워크스페이스와 연계된 모든 프로젝트, 일감, 채팅 데이터가 완전히 삭제됩니다.\n정말로 삭제하시겠습니까?`
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

  if (!currentWorkspace) {
    return (
      <div className="p-8 text-center text-slate-400">
        선택된 활성 워크스페이스가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Notifications */}
      {actionError && (
        <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 1. Workspace Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-inner">
              {detail?.icon || currentWorkspace.icon || '🏢'}
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white">{detail?.name || currentWorkspace.name}</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  {currentWorkspace.myRole || 'MEMBER'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                슬러그: <span className="font-mono text-slate-300">{detail?.slug || currentWorkspace.slug}</span>
                {detail?.dbType && <span className="ml-3 text-slate-500">DB: {detail.dbType} (물리 격리)</span>}
              </p>
            </div>
          </div>

          {isOwnerOrAdmin && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>정보 수정</span>
            </button>
          )}
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">아이콘 선택</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setEditIcon(emoji)}
                    className={`w-9 h-9 rounded-xl text-base flex items-center justify-center border transition-all ${
                      editIcon === emoji
                        ? 'bg-indigo-600/20 border-indigo-500 text-white scale-105'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">워크스페이스 이름</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800/70 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">설명</label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800/70 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-300 text-xs hover:bg-slate-800"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl shadow-md"
              >
                {updateMutation.isPending ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed">
            {detail?.description || '설명이 등록되어 있지 않습니다.'}
          </p>
        )}
      </div>

      {/* 2. Workspace Members List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">소속 멤버 ({detail?.members?.length || 0})</h3>
          </div>
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium rounded-xl transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>동료 초대</span>
            </button>
          )}
        </div>

        {/* Members Table */}
        <div className="divide-y divide-slate-800/60">
          {detail?.members?.map((member) => {
            const isTargetOwner = member.role === 'OWNER';
            return (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar user={member.user as any} size={28} shape="rounded" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100">
                        {member.user?.name || member.user?.email}
                      </span>
                      {isTargetOwner && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                          소유자 (Owner)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{member.user?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Selector or Badge */}
                  {isOwnerOrAdmin && !isTargetOwner ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value as WorkspaceRole)}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ADMIN">ADMIN (관리자)</option>
                      <option value="MEMBER">MEMBER (구성원)</option>
                      <option value="GUEST">GUEST (게스트)</option>
                    </select>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-800/40 rounded-lg">
                      {member.role}
                    </span>
                  )}

                  {/* Remove Button */}
                  {isOwnerOrAdmin && !isTargetOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.userId, member.user?.name || member.user?.email)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="멤버 제외"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Danger Zone (Delete Workspace) */}
      {isOwner && (
        <div className="bg-rose-950/20 border border-rose-800/40 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>위험 구역 (Danger Zone)</span>
          </h3>
          <p className="text-xs text-rose-300/70 leading-relaxed">
            워크스페이스를 삭제하면 해당 워크스페이스의 모든 프로젝트, 일감, 채팅 데이터 및 격리된 데이터베이스 파일이
            영구적으로 삭제됩니다.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleDeleteWorkspace}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all"
            >
              워크스페이스 영구 삭제
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <WorkspaceInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};
