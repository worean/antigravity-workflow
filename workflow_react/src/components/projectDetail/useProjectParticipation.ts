import { useState } from 'react';
import type { Project } from '@/types';
import {
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  addProjectGroup,
  removeProjectGroup,
  updateProjectGroupRole,
} from '@/services/api';

interface UseProjectParticipationProps {
  project: Project | null;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  executeAction: <T>(action: () => Promise<T>, options?: { onSuccess?: (data: T) => void; onError?: (err: any) => void }) => Promise<T | null>;
}


export function useProjectParticipation({
  project,
  setProject,
  executeAction,
}: UseProjectParticipationProps) {
  // Sub-Tab State: 'members' | 'groups'
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'groups'>('members');

  // Member Modals State
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<number | ''>('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<string>('MEMBER');

  // Group Modals State
  const [showAddGroupModal, setShowAddGroupModal] = useState<boolean>(false);
  const [selectedGroupIdToAdd, setSelectedGroupIdToAdd] = useState<number | ''>('');
  const [selectedGroupRole, setSelectedGroupRole] = useState<string>('MEMBER');

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

  return {
    activeSubTab,
    setActiveSubTab,
    showAddMemberModal,
    setShowAddMemberModal,
    selectedUserIdToAdd,
    setSelectedUserIdToAdd,
    selectedMemberRole,
    setSelectedMemberRole,
    handleAddMember,
    handleUpdateMemberRole,
    handleRemoveMember,
    showAddGroupModal,
    setShowAddGroupModal,
    selectedGroupIdToAdd,
    setSelectedGroupIdToAdd,
    selectedGroupRole,
    setSelectedGroupRole,
    handleAddGroup,
    handleUpdateGroupRole,
    handleRemoveGroup,
  };
}
