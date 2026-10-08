﻿import React, { useState } from 'react';
import type { Group, GroupMember, User as UserType } from '@/types';
import { Building2, FolderPlus } from 'lucide-react';
import { Button, Spinner } from '@/components/common';
import { GroupModal } from '@/components/GroupModal';
import {
  OrgTreeSidebar,
  OrgGroupDetailHeader,
  OrgGroupMembersList,
  OrgAddMemberModal,
} from './org';

interface SettingsOrgTabProps {
  isAuthenticated: boolean;
  user: UserType | null;
  treeGroups: Group[];
  flatGroups: Group[];
  loadingGroups: boolean;
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
  expandedGroupIds: Set<number>;
  setExpandedGroupIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  allUsers: UserType[];
  showGroupForm: boolean;
  setShowGroupForm: (show: boolean) => void;
  groupParentId: number | null;
  setGroupParentId: (id: number | null) => void;
  showMemberForm: boolean;
  setShowMemberForm: (show: boolean) => void;
  newMemberUserId: number | '';
  setNewMemberUserId: (id: number | '') => void;
  newMemberRole: string;
  setNewMemberRole: (role: string) => void;
  newMemberTitle: string;
  setNewMemberTitle: (title: string) => void;
  isPending: boolean;
  onGroupCreated?: (saved?: Group) => void;
  handleDeleteGroup: (groupId: number, groupName: string) => void;
  handleAddMember: (e: React.FormEvent) => void;
  handleUpdateMemberRole: (member: GroupMember, newRole: string) => void;
  handleRemoveMember: (membershipId: number, memberName: string) => void;
}

export const SettingsOrgTab: React.FC<SettingsOrgTabProps> = ({
  isAuthenticated,
  user,
  treeGroups,
  flatGroups,
  loadingGroups,
  selectedGroupId,
  setSelectedGroupId,
  expandedGroupIds,
  setExpandedGroupIds,
  allUsers,
  showGroupForm,
  setShowGroupForm,
  groupParentId,
  setGroupParentId,
  showMemberForm,
  setShowMemberForm,
  newMemberUserId,
  setNewMemberUserId,
  newMemberRole,
  setNewMemberRole,
  newMemberTitle,
  setNewMemberTitle,
  isPending,
  onGroupCreated,
  handleDeleteGroup,
  handleAddMember,
  handleUpdateMemberRole,
  handleRemoveMember,
}) => {
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const selectedGroup = flatGroups.find((g) => g.id === selectedGroupId) || flatGroups[0] || null;

  const toggleGroupExpand = (groupId: number) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header Title & Top Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '10px',
          flexShrink: 0,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-bright)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 size={16} color="var(--primary)" />
            조직도 및 부서/팀 계층 관리
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            본부, 부서, 서브그룹 및 팀 계층 구조를 정의하고 소속 팀원과 관리자 권한을 관리합니다.
          </p>
        </div>
        {isAuthenticated && (
          <Button
            variant="primary"
            size="sm"
            icon={<FolderPlus size={13} />}
            onClick={() => {
              setEditingGroup(null);
              setGroupParentId(null);
              setShowGroupForm(true);
            }}
          >
            최상위 그룹 추가
          </Button>
        )}
      </div>

      {loadingGroups ? (
        <Spinner centered label="조직도 데이터 불러오는 중..." />
      ) : (
        <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: '400px' }}>
          {/* Left Column: Organization Tree */}
          <OrgTreeSidebar
            treeGroups={treeGroups}
            flatGroups={flatGroups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            expandedGroupIds={expandedGroupIds}
            onToggleExpand={toggleGroupExpand}
            isAuthenticated={isAuthenticated}
            onEditGroup={(g) => {
              setEditingGroup(g);
              setGroupParentId(g.parentId || null);
              setShowGroupForm(true);
            }}
            onAddSubGroup={(pId) => {
              setEditingGroup(null);
              setGroupParentId(pId);
              setShowGroupForm(true);
            }}
          />

          {/* Right Column: Selected Group Detail & Members */}
          <div
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            {selectedGroup ? (
              <>
                <OrgGroupDetailHeader
                  group={selectedGroup}
                  isAuthenticated={isAuthenticated}
                  onEditGroup={() => {
                    setEditingGroup(selectedGroup);
                    setGroupParentId(selectedGroup.parentId || null);
                    setShowGroupForm(true);
                  }}
                  onOpenAddMember={() => {
                    setNewMemberUserId('');
                    setNewMemberRole('MEMBER');
                    setNewMemberTitle('');
                    setShowMemberForm(true);
                  }}
                  onDeleteGroup={() => handleDeleteGroup(selectedGroup.id, selectedGroup.name)}
                />

                <OrgGroupMembersList
                  group={selectedGroup}
                  currentUser={user}
                  isAuthenticated={isAuthenticated}
                  onUpdateMemberRole={handleUpdateMemberRole}
                  onRemoveMember={handleRemoveMember}
                />
              </>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                좌측 조직도에서 그룹을 선택하세요.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Group Create / Edit Modal */}
      <GroupModal
        isOpen={showGroupForm}
        onClose={() => {
          setShowGroupForm(false);
          setGroupParentId(null);
          setEditingGroup(null);
        }}
        parentId={groupParentId}
        group={editingGroup}
        flatGroups={flatGroups}
        onSuccess={(saved) => {
          setShowGroupForm(false);
          setGroupParentId(null);
          setEditingGroup(null);
          if (saved?.id) {
            setSelectedGroupId(saved.id);
          }
          if (onGroupCreated) {
            onGroupCreated(saved);
          }
        }}
      />

      {/* Add Member Modal */}
      <OrgAddMemberModal
        isOpen={showMemberForm}
        onClose={() => setShowMemberForm(false)}
        selectedGroup={selectedGroup}
        currentUser={user}
        allUsers={allUsers}
        newMemberUserId={newMemberUserId}
        setNewMemberUserId={setNewMemberUserId}
        newMemberRole={newMemberRole}
        setNewMemberRole={setNewMemberRole}
        newMemberTitle={newMemberTitle}
        setNewMemberTitle={setNewMemberTitle}
        isPending={isPending}
        onAddMember={handleAddMember}
      />
    </div>
  );
};
