import React from 'react';
import { Users, Building2, UserPlus } from 'lucide-react';
import type { Project, User, Group } from '@/types';
import { Button } from '@/components/common';
import { ProjectMembersTab } from './ProjectMembersTab';
import { ProjectGroupsTab } from './ProjectGroupsTab';

interface ProjectParticipationSectionProps {
  project: Project;
  allUsers: User[];
  allGroups: Group[];
  isPM: boolean;
  activeSubTab: 'members' | 'groups';
  setActiveSubTab: (tab: 'members' | 'groups') => void;
  handleUpdateMemberRole: (userId: number, role: string) => Promise<void>;
  handleRemoveMember: (userId: number) => Promise<void>;
  showAddMemberModal: boolean;
  setShowAddMemberModal: (show: boolean) => void;
  selectedUserIdToAdd: number | '';
  setSelectedUserIdToAdd: (id: number | '') => void;
  selectedMemberRole: string;
  setSelectedMemberRole: (role: string) => void;
  handleAddMember: (e: React.FormEvent) => Promise<void>;
  handleUpdateGroupRole: (groupId: number, role: string) => Promise<void>;
  handleRemoveGroup: (groupId: number) => Promise<void>;
  showAddGroupModal: boolean;
  setShowAddGroupModal: (show: boolean) => void;
  selectedGroupIdToAdd: number | '';
  setSelectedGroupIdToAdd: (id: number | '') => void;
  selectedGroupRole: string;
  setSelectedGroupRole: (role: string) => void;
  handleAddGroup: (e: React.FormEvent) => Promise<void>;
}

export const ProjectParticipationSection: React.FC<ProjectParticipationSectionProps> = ({
  project,
  allUsers,
  allGroups,
  isPM,
  activeSubTab,
  setActiveSubTab,
  handleUpdateMemberRole,
  handleRemoveMember,
  showAddMemberModal,
  setShowAddMemberModal,
  selectedUserIdToAdd,
  setSelectedUserIdToAdd,
  selectedMemberRole,
  setSelectedMemberRole,
  handleAddMember,
  handleUpdateGroupRole,
  handleRemoveGroup,
  showAddGroupModal,
  setShowAddGroupModal,
  selectedGroupIdToAdd,
  setSelectedGroupIdToAdd,
  selectedGroupRole,
  setSelectedGroupRole,
  handleAddGroup,
}) => {
  return (
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

      {/* SubTab Content */}
      {activeSubTab === 'members' ? (
        <ProjectMembersTab
          project={project}
          allUsers={allUsers}
          isPM={isPM}
          handleUpdateMemberRole={handleUpdateMemberRole}
          handleRemoveMember={handleRemoveMember}
          showAddMemberModal={showAddMemberModal}
          setShowAddMemberModal={setShowAddMemberModal}
          selectedUserIdToAdd={selectedUserIdToAdd}
          setSelectedUserIdToAdd={setSelectedUserIdToAdd}
          selectedMemberRole={selectedMemberRole}
          setSelectedMemberRole={setSelectedMemberRole}
          handleAddMember={handleAddMember}
        />
      ) : (
        <ProjectGroupsTab
          project={project}
          allGroups={allGroups}
          isPM={isPM}
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
      )}
    </div>
  );
};