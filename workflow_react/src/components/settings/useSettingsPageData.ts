import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  updateUser, getUsers, getCustomFields, createCustomField, deleteCustomField,
  checkHealth, getGroups, deleteGroup, addGroupMember, updateGroupMember,
  removeGroupMember, getMe, saveCustomBackendUrl, resetCustomBackendUrl,
  testApiConnection, getCurrentBackendHostUrl,
} from '@/services/api';
import type { CustomFieldDefinition, HealthStatus, Group, GroupMember, User as UserType } from '@/types';
import { sendDesktopNotification, requestWebNotificationPermission } from '@/utils/notificationUtils';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { usePrefStore } from '@/stores/usePrefStore';
import { useProjects } from '@/api/projects';
import type { SettingsTabType } from './SettingsSidebarNav';

export function useSettingsPageData() {
  const { user, isAuthenticated, updateUserLocal } = useAuth();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  const [activeSubTab, setActiveSubTab] = useState<SettingsTabType>('profile');
  const { data: projects = [] } = useProjects();

  // --- TAB 1: User Profile State ---
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [cropTarget, setCropTarget] = useState<{ src: string; fileName: string } | null>(null);

  // --- TAB 2: Organization State ---
  const [treeGroups, setTreeGroups] = useState<Group[]>([]);
  const [flatGroups, setFlatGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(new Set());
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [showGroupForm, setShowGroupForm] = useState<boolean>(false);
  const [groupParentId, setGroupParentId] = useState<number | null>(null);
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
  const desktopNotifications = usePrefStore((s) => s.desktopNotifications);
  const compactCards = usePrefStore((s) => s.compactCards);
  const defaultPriority = usePrefStore((s) => s.defaultPriority);
  const isSundayStart = usePrefStore((s) => s.isSundayStart);
  const timeFormat = usePrefStore((s) => s.timeFormat);
  const setDesktopNotifications = usePrefStore((s) => s.setDesktopNotifications);
  const setCompactCards = usePrefStore((s) => s.setCompactCards);
  const setDefaultPriority = usePrefStore((s) => s.setDefaultPriority);
  const setSundayStart = usePrefStore((s) => s.setSundayStart);
  const setTimeFormat = usePrefStore((s) => s.setTimeFormat);
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);
  const [prioritySavedFeedback, setPrioritySavedFeedback] = useState<boolean>(false);
  const [weekStartSavedFeedback, setWeekStartSavedFeedback] = useState<boolean>(false);
  const [timeFormatSavedFeedback, setTimeFormatSavedFeedback] = useState<boolean>(false);

  // --- TAB 5: System & Backend Endpoint State ---
  const [backendUrlInput, setBackendUrlInput] = useState<string>(() => getCurrentBackendHostUrl());
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean; status?: string; latencyMs: number; error?: string; timestamp?: string;
  } | null>(null);
  const [backendSaveFeedback, setBackendSaveFeedback] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);

  const loadProfileData = async () => {
    if (!isAuthenticated) return;
    setLoadingProfile(true);
    try {
      const me: any = await getMe();
      const u = me.user || me;
      if (u) {
        setName(u.name || '');
        setEmail(u.email || '');
        setAvatar(u.avatar || null);
        setAvatarColor(u.avatarColor || null);
        setBio(u.bio || '');
        setDepartment(u.department || '');
        setJobTitle(u.jobTitle || '');
        if (updateUserLocal) updateUserLocal(u);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadGroupsData = async () => {
    if (!isAuthenticated) return;
    setLoadingGroups(true);
    try {
      const [treeData, flatData, usersData] = await Promise.all([getGroups(true), getGroups(false), getUsers()]);
      setTreeGroups(treeData);
      setFlatGroups(flatData);
      setAllUsers(usersData);
      if (!selectedGroupId && flatData.length > 0) setSelectedGroupId(flatData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadCustomFieldsData = async () => {
    setLoadingFields(true);
    try { setCustomFields(await getCustomFields()); } catch (err) { console.error(err); } finally { setLoadingFields(false); }
  };

  const loadHealthData = async () => {
    setHealthLoading(true);
    try { setHealth(await checkHealth()); } catch (err) { console.error(err); } finally { setHealthLoading(false); }
  };

  useEffect(() => { if (isAuthenticated && activeSubTab === 'profile') loadProfileData(); }, [isAuthenticated, activeSubTab]);
  useEffect(() => { if (activeSubTab === 'organization' && isAuthenticated) loadGroupsData(); }, [activeSubTab, isAuthenticated]);
  useEffect(() => { if (activeSubTab === 'customFields') loadCustomFieldsData(); }, [activeSubTab]);
  useEffect(() => { if (activeSubTab === 'system') loadHealthData(); }, [activeSubTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('이름을 입력해주세요.');
    await executeAction(
      async () => {
        const updated = await updateUser(user!.id, {
          name: name.trim(), avatar: avatar ?? null, avatarColor: avatarColor ?? null,
          bio: bio.trim() || null, department: department.trim() || null, jobTitle: jobTitle.trim() || null,
        });
        if (updated && updateUserLocal) updateUserLocal(updated);
        return updated;
      },
      {
        onSuccess: async () => {
          setProfileSuccessMsg('프로필이 성공적으로 저장되었습니다.');
          setTimeout(() => setProfileSuccessMsg(null), 3000);
          await loadProfileData();
        },
      }
    );
  };

  const handleGroupCreated = (saved?: Group) => {
    if (saved?.id) setSelectedGroupId(saved.id);
    loadGroupsData();
    loadProfileData();
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`'${groupName}' 그룹을 정말 삭제하시겠습니까? 소속 멤버 연결이 모두 해제됩니다.`)) return;
    await executeAction(async () => { await deleteGroup(groupId); }, {
      onSuccess: () => {
        if (selectedGroupId === groupId) setSelectedGroupId(null);
        loadGroupsData();
        loadProfileData();
      },
    });
  };

  const handleAddMemberToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newMemberUserId) return alert('추가할 멤버를 선택해주세요.');
    await executeAction(
      async () => addGroupMember(selectedGroupId, {
        userId: Number(newMemberUserId), role: newMemberRole, title: newMemberTitle.trim() || undefined,
      }),
      {
        onSuccess: () => {
          setShowMemberForm(false);
          setNewMemberUserId('');
          setNewMemberRole('MEMBER');
          setNewMemberTitle('');
          loadGroupsData();
          loadProfileData();
        },
      }
    );
  };

  const handleUpdateMemberRole = async (member: GroupMember, newRole: string) => {
    if (!selectedGroupId) return;
    await executeAction(
      async () => updateGroupMember(selectedGroupId, member.userId || member.user?.id || 0, {
        role: newRole, title: member.title || undefined,
      }),
      { onSuccess: () => { loadGroupsData(); loadProfileData(); } }
    );
  };

  const handleRemoveMemberFromGroup = async (membershipId: number, memberName: string) => {
    if (!selectedGroupId) return;
    if (!confirm(`'${memberName}' 멤버를 그룹에서 제외하시겠습니까?`)) return;
    await executeAction(async () => { await removeGroupMember(selectedGroupId, membershipId); }, {
      onSuccess: () => { loadGroupsData(); loadProfileData(); },
    });
  };

  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldKey.trim() || !fieldName.trim()) return alert('필드 키와 필드명은 필수 입력 항목입니다.');
    await executeAction(
      async () => createCustomField({
        key: fieldKey.trim().toUpperCase(), name: fieldName.trim(), fieldType,
        description: fieldDesc.trim() || undefined, isRequired: fieldRequired,
      }),
      {
        onSuccess: () => {
          setShowFieldForm(false); setFieldKey(''); setFieldName(''); setFieldType('TEXT');
          setFieldDesc(''); setFieldRequired(false); loadCustomFieldsData();
        },
      }
    );
  };

  const handleDeleteCustomField = async (fieldId: number) => {
    const cf = customFields.find((f) => f.id === fieldId);
    if (!confirm(`'${cf?.name}' 커스텀 필드를 정말 삭제하시겠습니까?`)) return;
    await executeAction(async () => { await deleteCustomField(fieldId); }, { onSuccess: loadCustomFieldsData });
  };

  const handleToggleDesktopNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestWebNotificationPermission();
      if (granted) {
        setDesktopNotifications(true);
        sendDesktopNotification({
          title: '데스크톱 알림 활성화',
          body: 'AntiGravity Workflow 데스크톱 알림이 성공적으로 활성화되었습니다.',
        });
      } else {
        alert('OS 알림 권한이 거부되었거나 지원되지 않는 환경입니다.');
        setDesktopNotifications(false);
      }
    } else {
      setDesktopNotifications(false);
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

  const handleToggleCompactCards = (enabled: boolean) => setCompactCards(enabled);
  const handleDefaultPriorityChange = (priorityId: number) => {
    setDefaultPriority(priorityId);
    setPrioritySavedFeedback(true);
    setTimeout(() => setPrioritySavedFeedback(false), 2000);
  };
  const handleWeekStartChange = (isSunday: boolean) => {
    setSundayStart(isSunday);
    setWeekStartSavedFeedback(true);
    setTimeout(() => setWeekStartSavedFeedback(false), 2000);
  };
  const handleTimeFormatChange = (format: '12h' | '24h') => {
    setTimeFormat(format);
    setTimeFormatSavedFeedback(true);
    setTimeout(() => setTimeFormatSavedFeedback(false), 2000);
  };

  const handleTestBackendConnection = async (targetUrl?: string) => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testApiConnection(targetUrl || backendUrlInput.trim());
      setTestResult({
        success: res.success, status: res.status, latencyMs: res.latencyMs,
        error: res.error, timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setTestResult({
        success: false, latencyMs: 0, error: err.message || '연결 실패',
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

  return {
    user, isAuthenticated, isPending, errorState, closeErrorModal, activeSubTab, setActiveSubTab, projects,
    name, setName, email, avatar, setAvatar, avatarColor, setAvatarColor, bio, setBio, department, setDepartment,
    jobTitle, setJobTitle, profileSuccessMsg, loadingProfile, handleSaveProfile, loadProfileData, cropTarget, setCropTarget,
    treeGroups, flatGroups, loadingGroups, selectedGroupId, setSelectedGroupId, expandedGroupIds, setExpandedGroupIds,
    allUsers, showGroupForm, setShowGroupForm, groupParentId, setGroupParentId, showMemberForm, setShowMemberForm,
    newMemberUserId, setNewMemberUserId, newMemberRole, setNewMemberRole, newMemberTitle, setNewMemberTitle,
    handleGroupCreated, handleDeleteGroup, handleAddMemberToGroup, handleUpdateMemberRole, handleRemoveMemberFromGroup,
    customFields, loadingFields, showFieldForm, setShowFieldForm, fieldKey, setFieldKey, fieldName, setFieldName,
    fieldType, setFieldType, fieldDesc, setFieldDesc, fieldRequired, setFieldRequired, handleCreateCustomField, handleDeleteCustomField,
    desktopNotifications, handleToggleDesktopNotifications, handleSendTestNotification, testNotificationSent,
    compactCards, handleToggleCompactCards, defaultPriority, handleDefaultPriorityChange, prioritySavedFeedback,
    isSundayStart, handleWeekStartChange, weekStartSavedFeedback,
    timeFormat, handleTimeFormatChange, timeFormatSavedFeedback,
    backendUrlInput, setBackendUrlInput,
    testingConnection, handleTestBackendConnection, handleSaveBackendUrl, handleResetBackendUrl,
    backendSaveFeedback, testResult, health, healthLoading,
  };
}
