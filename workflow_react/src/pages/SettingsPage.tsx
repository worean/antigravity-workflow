// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  updateUser,
  getUsers,
  getCustomFields,
  createCustomField,
  deleteCustomField,
  checkHealth,
  getGroups,
  createGroup,
  deleteGroup,
  addGroupMember,
  updateGroupMember,
  removeGroupMember,
  getMe,
  saveCustomBackendUrl,
  resetCustomBackendUrl,
  testApiConnection,
  getCurrentBackendHostUrl,
} from '@/services/api';
import type { CustomFieldDefinition, HealthStatus, Group, GroupMember, User as UserType } from '@/types';
import {
  sendDesktopNotification,
  requestWebNotificationPermission,
} from '@/utils/notificationUtils';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import { prefRepository } from '@/lib/prefRepository';
import {
  SettingsHeaderToolbar,
  SettingsSidebarNav,
  SettingsProfileTab,
  SettingsWorkspaceTab,
  SettingsOrgTab,
  SettingsCustomFieldsTab,
  SettingsDisplayTab,
  SettingsSystemTab,
  type SettingsTabType,
} from '@/components/settings';

interface SettingsPageProps {
  onOpenAuth?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const { user, isAuthenticated } = useAuth();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<SettingsTabType>('profile');

  // --- TAB 1: User Profile State ---
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState<string | null>(null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // Avatar Crop Modal State
  const [, setShowCropModal] = useState<boolean>(false);
  const [, setCropImageSrc] = useState<string | null>(null);
  const [, setCropFileName] = useState<string>('');
  const [, setCropZoom] = useState<number>(1);
  const [, setCropPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // --- TAB 2: Organization (Groups & Permissions) State ---
  const [treeGroups, setTreeGroups] = useState<Group[]>([]);
  const [flatGroups, setFlatGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(new Set());
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  // Create Group Form State
  const [showGroupForm, setShowGroupForm] = useState<boolean>(false);
  const [groupParentId, setGroupParentId] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupCode, setNewGroupCode] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');

  // Add Member to Group Form State
  const [showMemberForm, setShowMemberForm] = useState<boolean>(false);
  const [newMemberUserId, setNewMemberUserId] = useState<number | ''>('');
  const [newMemberRole, setNewMemberRole] = useState<string>('MEMBER');
  const [newMemberTitle, setNewMemberTitle] = useState<string>('');

  // --- TAB 3: Custom Fields State ---
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loadingFields, setLoadingFields] = useState<boolean>(false);
  const [showFieldForm, setShowFieldForm] = useState<boolean>(false);
  const [fieldKey, setFieldKey] = useState<string>('');
  const [fieldName, setFieldName] = useState<string>('');
  const [fieldType, setFieldType] = useState<string>('TEXT');
  const [fieldDesc, setFieldDesc] = useState<string>('');
  const [fieldRequired, setFieldRequired] = useState<boolean>(false);

  // --- TAB 4: Display & Notification Preferences State ---
  const [desktopNotifications, setDesktopNotifications] = useState<boolean>(() => prefRepository.desktopNotifications);
  const [compactCards, setCompactCards] = useState<boolean>(() => prefRepository.compactCards);
  const [defaultPriority, setDefaultPriority] = useState<number>(() => prefRepository.defaultPriority);
  const [isSundayStart, setIsSundayStart] = useState<boolean>(() => prefRepository.isSundayStart);
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);
  const [prioritySavedFeedback, setPrioritySavedFeedback] = useState<boolean>(false);
  const [weekStartSavedFeedback, setWeekStartSavedFeedback] = useState<boolean>(false);

  // --- TAB 5: System & Backend Endpoint State ---
  const [backendUrlInput, setBackendUrlInput] = useState<string>(() => getCurrentBackendHostUrl());
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status?: string;
    latencyMs: number;
    error?: string;
    timestamp?: string;
  } | null>(null);
  const [backendSaveFeedback, setBackendSaveFeedback] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);

  // Load Profile
  const loadProfileData = async () => {
    if (!isAuthenticated) return;
    setLoadingProfile(true);
    try {
      const me: any = await getMe();
      const u = me.user || me;
      setName(u.name || '');
      setEmail(u.email || '');
      setAvatar(u.avatar || null);
      setAvatarColor(u.avatarColor || null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProfileData();
    }
  }, [isAuthenticated]);

  // Load Organization
  const loadGroupsData = async () => {
    if (!isAuthenticated) return;
    setLoadingGroups(true);
    try {
      const [treeData, flatData, usersData] = await Promise.all([
        getGroups(true),
        getGroups(false),
        getUsers(),
      ]);
      setTreeGroups(treeData);
      setFlatGroups(flatData);
      setAllUsers(usersData);

      if (!selectedGroupId && flatData.length > 0) {
        setSelectedGroupId(flatData[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'organization' && isAuthenticated) {
      loadGroupsData();
    }
  }, [activeSubTab, isAuthenticated]);

  // Load Custom Fields
  const loadCustomFieldsData = async () => {
    setLoadingFields(true);
    try {
      const fields = await getCustomFields();
      setCustomFields(fields);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'customFields') {
      loadCustomFieldsData();
    }
  }, [activeSubTab]);

  // Load Health Status
  const loadHealthData = async () => {
    setHealthLoading(true);
    try {
      const h = await checkHealth();
      setHealth(h);
    } catch (err: any) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'system') {
      loadHealthData();
    }
  }, [activeSubTab]);

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('이름을 입력해주세요.');

    await executeAction(
      async () => {
        return await updateUser(user!.id, {
          name: name.trim(),
          avatar: avatar || undefined,
          avatarColor: avatarColor || undefined,
        });
      },
      {
        onSuccess: async () => {
          setProfileSuccessMsg('프로필이 성공적으로 저장되었습니다.');
          setTimeout(() => setProfileSuccessMsg(null), 3000);
        },
      }
    );
  };

  // Group Handlers
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupCode.trim()) {
      return alert('그룹명과 그룹 코드는 필수입니다.');
    }

    await executeAction(
      async () => {
        return await createGroup({
          name: newGroupName.trim(),
          code: newGroupCode.trim().toUpperCase(),
          description: newGroupDesc.trim() || undefined,
          parentId: groupParentId || undefined,
        });
      },
      {
        onSuccess: (newGrp) => {
          setShowGroupForm(false);
          setNewGroupName('');
          setNewGroupCode('');
          setNewGroupDesc('');
          setGroupParentId(null);
          setSelectedGroupId(newGrp.id);
          loadGroupsData();
        },
      }
    );
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`'${groupName}' 그룹을 정말 삭제하시겠습니까? 소속 멤버 연결이 모두 해제됩니다.`)) return;

    await executeAction(
      async () => {
        await deleteGroup(groupId);
      },
      {
        onSuccess: () => {
          if (selectedGroupId === groupId) {
            setSelectedGroupId(null);
          }
          loadGroupsData();
        },
      }
    );
  };

  const handleAddMemberToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newMemberUserId) {
      return alert('추가할 멤버를 선택해주세요.');
    }

    await executeAction(
      async () => {
        return await addGroupMember(selectedGroupId, {
          userId: Number(newMemberUserId),
          role: newMemberRole,
          title: newMemberTitle.trim() || undefined,
        });
      },
      {
        onSuccess: () => {
          setShowMemberForm(false);
          setNewMemberUserId('');
          setNewMemberRole('MEMBER');
          setNewMemberTitle('');
          loadGroupsData();
        },
      }
    );
  };

  const handleUpdateMemberRole = async (member: GroupMember, newRole: string) => {
    if (!selectedGroupId) return;

    await executeAction(
      async () => {
        return await updateGroupMember(selectedGroupId, member.userId || member.user?.id || 0, {
          role: newRole,
          title: member.title || undefined,
        });
      },
      {
        onSuccess: () => {
          loadGroupsData();
        },
      }
    );
  };

  const handleRemoveMemberFromGroup = async (membershipId: number, memberName: string) => {
    if (!selectedGroupId) return;
    if (!confirm(`'${memberName}' 멤버를 그룹에서 제외하시겠습니까?`)) return;

    await executeAction(
      async () => {
        await removeGroupMember(selectedGroupId, membershipId);
      },
      {
        onSuccess: () => {
          loadGroupsData();
        },
      }
    );
  };

  // Custom Field Handlers
  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldKey.trim() || !fieldName.trim()) {
      return alert('필드 키와 필드명은 필수 입력 항목입니다.');
    }

    await executeAction(
      async () => {
        return await createCustomField({
          key: fieldKey.trim().toUpperCase(),
          name: fieldName.trim(),
          fieldType: fieldType,
          description: fieldDesc.trim() || undefined,
          isRequired: fieldRequired,
        });
      },
      {
        onSuccess: () => {
          setShowFieldForm(false);
          setFieldKey('');
          setFieldName('');
          setFieldType('TEXT');
          setFieldDesc('');
          setFieldRequired(false);
          loadCustomFieldsData();
        },
      }
    );
  };

  const handleDeleteCustomField = async (fieldId: number) => {
    const cf = customFields.find((f) => f.id === fieldId);
    if (!confirm(`'${cf?.name}' 커스텀 필드를 정말 삭제하시겠습니까?`)) return;

    await executeAction(
      async () => {
        await deleteCustomField(fieldId);
      },
      {
        onSuccess: () => {
          loadCustomFieldsData();
        },
      }
    );
  };

  // Display Preferences Handlers
  const handleToggleDesktopNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestWebNotificationPermission();
      if (granted) {
        setDesktopNotifications(true);
        prefRepository.desktopNotifications = true;
        sendDesktopNotification({
          title: '데스크톱 알림 활성화',
          body: 'AntiGravity Workflow 데스크톱 알림이 성공적으로 활성화되었습니다.',
        });
      } else {
        alert('OS 알림 권한이 거부되었거나 지원되지 않는 환경입니다.');
        setDesktopNotifications(false);
        prefRepository.desktopNotifications = false;
      }
    } else {
      setDesktopNotifications(false);
      prefRepository.desktopNotifications = false;
    }
  };

  const handleSendTestNotification = () => {
    sendDesktopNotification({
      title: 'AntiGravity 알림 테스트',
      body: '정상적으로 데스크톱 OS 토스트 알림을 수신하고 있습니다!',
    });
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const handleToggleCompactCards = (enabled: boolean) => {
    setCompactCards(enabled);
    prefRepository.compactCards = enabled;
  };

  const handleDefaultPriorityChange = (priorityId: number) => {
    setDefaultPriority(priorityId);
    prefRepository.defaultPriority = priorityId;
    setPrioritySavedFeedback(true);
    setTimeout(() => setPrioritySavedFeedback(false), 2000);
  };

  const handleWeekStartChange = (isSunday: boolean) => {
    setIsSundayStart(isSunday);
    prefRepository.isSundayStart = isSunday;
    setWeekStartSavedFeedback(true);
    setTimeout(() => setWeekStartSavedFeedback(false), 2000);
  };

  // Backend Endpoint Handlers
  const handleTestBackendConnection = async (targetUrl?: string) => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testApiConnection(targetUrl || backendUrlInput.trim());
      setTestResult({
        success: res.success,
        status: res.status,
        latencyMs: res.latencyMs,
        error: res.error,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        error: err.message || '연결 실패',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveBackendUrl = async () => {
    if (!backendUrlInput.trim()) return;
    await saveCustomBackendUrl(backendUrlInput.trim());
    setBackendSaveFeedback('백엔드 접속 주소가 성공적으로 저장되었습니다. (새로고침 시 자동 적용)');
    setTimeout(() => setBackendSaveFeedback(null), 4000);
    loadHealthData();
  };

  const handleResetBackendUrl = async () => {
    await resetCustomBackendUrl();
    setBackendUrlInput(getCurrentBackendHostUrl());
    setBackendSaveFeedback('기본 백엔드 주소로 재설정되었습니다.');
    setTimeout(() => setBackendSaveFeedback(null), 3000);
    loadHealthData();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      {/* 1. Top Header */}
      <SettingsHeaderToolbar />

      {/* 2. Main 2-Column Settings Layout */}
      <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}>
        {/* Left Sub-Tab Menu */}
        <SettingsSidebarNav
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
        />

        {/* Right Content Panel */}
        <div
          style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '16px 20px',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {activeSubTab === 'profile' && (
            <SettingsProfileTab
              user={user}
              name={name}
              setName={setName}
              email={email}
              avatar={avatar}
              setAvatar={setAvatar}
              avatarColor={avatarColor}
              setAvatarColor={setAvatarColor}
              profileSuccessMsg={profileSuccessMsg}
              loadingProfile={loadingProfile}
              isPending={isPending}
              handleSaveProfile={handleSaveProfile}
              loadProfileData={loadProfileData}
              setSelectedGroupId={setSelectedGroupId}
              setActiveSubTab={setActiveSubTab}
              onOpenCropModal={(img, fName) => {
                setCropImageSrc(img);
                setCropFileName(fName);
                setCropZoom(1);
                setCropPan({ x: 0, y: 0 });
                setShowCropModal(true);
              }}
            />
          )}

          {activeSubTab === 'workspace' && <SettingsWorkspaceTab />}

          {activeSubTab === 'organization' && (
            <SettingsOrgTab
              isAuthenticated={isAuthenticated}
              user={user}
              treeGroups={treeGroups}
              flatGroups={flatGroups}
              loadingGroups={loadingGroups}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              expandedGroupIds={expandedGroupIds}
              setExpandedGroupIds={setExpandedGroupIds}
              allUsers={allUsers}
              showGroupForm={showGroupForm}
              setShowGroupForm={setShowGroupForm}
              groupParentId={groupParentId}
              setGroupParentId={setGroupParentId}
              newGroupName={newGroupName}
              setNewGroupName={setNewGroupName}
              newGroupCode={newGroupCode}
              setNewGroupCode={setNewGroupCode}
              newGroupDesc={newGroupDesc}
              setNewGroupDesc={setNewGroupDesc}
              showMemberForm={showMemberForm}
              setShowMemberForm={setShowMemberForm}
              newMemberUserId={newMemberUserId}
              setNewMemberUserId={setNewMemberUserId}
              newMemberRole={newMemberRole}
              setNewMemberRole={setNewMemberRole}
              newMemberTitle={newMemberTitle}
              setNewMemberTitle={setNewMemberTitle}
              isPending={isPending}
              handleCreateGroup={handleCreateGroup}
              handleDeleteGroup={handleDeleteGroup}
              handleAddMember={handleAddMemberToGroup}
              handleUpdateMemberRole={handleUpdateMemberRole}
              handleRemoveMember={handleRemoveMemberFromGroup}
            />
          )}

          {activeSubTab === 'customFields' && (
            <SettingsCustomFieldsTab
              isAuthenticated={isAuthenticated}
              customFields={customFields}
              loadingFields={loadingFields}
              showFieldForm={showFieldForm}
              setShowFieldForm={setShowFieldForm}
              fieldKey={fieldKey}
              setFieldKey={setFieldKey}
              fieldName={fieldName}
              setFieldName={setFieldName}
              fieldType={fieldType}
              setFieldType={setFieldType}
              fieldDesc={fieldDesc}
              setFieldDesc={setFieldDesc}
              fieldRequired={fieldRequired}
              setFieldRequired={setFieldRequired}
              isPending={isPending}
              handleCreateCustomField={handleCreateCustomField}
              handleDeleteCustomField={handleDeleteCustomField}
            />
          )}

          {activeSubTab === 'display' && (
            <SettingsDisplayTab
              desktopNotifications={desktopNotifications}
              handleToggleDesktopNotifications={handleToggleDesktopNotifications}
              handleSendTestNotification={handleSendTestNotification}
              testNotificationSent={testNotificationSent}
              compactCards={compactCards}
              handleToggleCompactCards={handleToggleCompactCards}
              defaultPriority={defaultPriority}
              handleDefaultPriorityChange={handleDefaultPriorityChange}
              prioritySavedFeedback={prioritySavedFeedback}
              isSundayStart={isSundayStart}
              handleWeekStartChange={handleWeekStartChange}
              weekStartSavedFeedback={weekStartSavedFeedback}
            />
          )}

          {activeSubTab === 'system' && (
            <SettingsSystemTab
              backendUrlInput={backendUrlInput}
              setBackendUrlInput={setBackendUrlInput}
              testingConnection={testingConnection}
              handleTestBackendConnection={handleTestBackendConnection}
              handleSaveBackendUrl={handleSaveBackendUrl}
              handleResetBackendUrl={handleResetBackendUrl}
              backendSaveFeedback={backendSaveFeedback}
              testResult={testResult}
              health={health}
              healthLoading={healthLoading}
            />
          )}
        </div>
      </div>

      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </div>
  );
};