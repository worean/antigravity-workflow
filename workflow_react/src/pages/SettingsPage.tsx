import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
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
} from '../services/api';
import type { CustomFieldDefinition, HealthStatus, Group, GroupMember, User as UserType } from '../types';
import {
  User,
  Sliders,
  Palette,
  Server,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Bell,
  Monitor,
  Building2,
  Users,
  Shield,
  ChevronRight,
  ChevronDown,
  UserPlus,
  FolderPlus,
  Crown,
  Settings as SettingsIcon,
  Briefcase,
  ExternalLink,
  RefreshCw,
  Clock,
  Layers,
  Edit2,
  Camera,
  Dices,
} from 'lucide-react';


import { Button, Spinner, PrioritySelect, Avatar, getRandomAvatarColor } from '../components/common';
import { AvatarCropModal } from '../components/AvatarCropModal';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from '../components/ActionFeedbackModal';
import { sendDesktopNotification, isNotificationEnabled, requestWebNotificationPermission } from '../utils/notificationUtils';


type SettingsTab = 'profile' | 'organization' | 'customFields' | 'display' | 'system';

interface SettingsPageProps {
  onOpenAuth?: () => void;
}


export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenAuth }) => {
  const { user, isAuthenticated, updateUserLocal } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('profile');

  // 1. Profile State
  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [avatarColor, setAvatarColor] = useState<string | null>(user?.avatarColor || null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // Avatar Crop Modal State
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);



  // 2. Custom Fields State
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loadingFields, setLoadingFields] = useState<boolean>(false);
  const [showFieldForm, setShowFieldForm] = useState<boolean>(false);
  const [fieldKey, setFieldKey] = useState<string>('');
  const [fieldName, setFieldName] = useState<string>('');
  const [fieldType, setFieldType] = useState<string>('STRING');
  const [fieldDesc, setFieldDesc] = useState<string>('');
  const [fieldRequired, setFieldRequired] = useState<boolean>(false);

  // 3. Display & Notification Preferences State
  const [compactCards, setCompactCards] = useState<boolean>(() => {
    return localStorage.getItem('pref_compact_cards') === 'true';
  });

  const [defaultPriority, setDefaultPriority] = useState<number>(() => {
    return Number(localStorage.getItem('pref_default_priority')) || 2;
  });
  const [prioritySavedFeedback, setPrioritySavedFeedback] = useState<boolean>(false);

  const [isSundayStart, setIsSundayStart] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_is_sunday_start');
    return saved !== null ? saved === 'true' : true;
  });
  const [weekStartSavedFeedback, setWeekStartSavedFeedback] = useState<boolean>(false);

  const [desktopNotifications, setDesktopNotifications] = useState<boolean>(() => {
    return isNotificationEnabled();
  });
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);

  // 4. System Health State
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);

  // 5. Organization & Groups State
  const [treeGroups, setTreeGroups] = useState<Group[]>([]);
  const [flatGroups, setFlatGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(new Set());

  // Group Create Form Modal State
  const [showGroupForm, setShowGroupForm] = useState<boolean>(false);
  const [groupParentId, setGroupParentId] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupCode, setNewGroupCode] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');

  // Group Member Form Modal State
  const [showMemberForm, setShowMemberForm] = useState<boolean>(false);
  const [newMemberUserId, setNewMemberUserId] = useState<number | ''>('');
  const [newMemberRole, setNewMemberRole] = useState<string>('MEMBER');
  const [newMemberTitle, setNewMemberTitle] = useState<string>('');

  // All Users for Roles & Assignment
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || null);
      setAvatarColor(user.avatarColor || null);
    }
  }, [user]);

  // Load organization and users
  const loadOrganizationData = async () => {
    setLoadingGroups(true);
    try {
      const [tree, flat, users] = await Promise.all([
        getGroups(true),
        getGroups(false),
        getUsers(),
      ]);
      setTreeGroups(tree);
      setFlatGroups(flat);
      setAllUsers(users);

      if (tree.length > 0) {
        if (!selectedGroupId) setSelectedGroupId(tree[0].id);
        setExpandedGroupIds((prev) => {
          const next = new Set(prev);
          tree.forEach((g) => next.add(g.id));
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Load custom fields
  const loadCustomFields = async () => {
    setLoadingFields(true);
    try {
      const data = await getCustomFields();
      setCustomFields(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFields(false);
    }
  };

  // Load health info
  const loadHealth = async () => {
    setHealthLoading(true);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  };

  // Load profile with group memberships
  const loadProfileData = async () => {
    if (!isAuthenticated) return;
    setLoadingProfile(true);
    try {
      const res = await getMe();
      if (res.user) {
        updateUserLocal(res.user);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'profile') loadProfileData();
    if (activeSubTab === 'organization') loadOrganizationData();
    if (activeSubTab === 'customFields') loadCustomFields();
    if (activeSubTab === 'system') loadHealth();
  }, [activeSubTab]);


  // Handle Avatar File Selection (Max 2MB validation)
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 최대 2MB 크기 검사
    if (file.size > 2 * 1024 * 1024) {
      alert('⚠️ 아바타 이미지는 최대 2MB 이하의 파일만 업로드 가능합니다. (현재: ' + (file.size / (1024 * 1024)).toFixed(2) + 'MB)');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCropImageSrc(event.target.result);
        setCropFileName(file.name);
        setShowCropModal(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Crop Complete (256x256 PNG Data URL)
  const handleCropComplete = (croppedPngDataUrl: string) => {
    setAvatar(croppedPngDataUrl);
    setProfileSuccessMsg('아바타 이미지가 크롭되었습니다. [프로필 저장]을 눌러 서버에 반영하세요.');
    setTimeout(() => setProfileSuccessMsg(null), 4000);
  };

  // Handle Random Avatar Color
  const handleRandomAvatarColor = () => {
    const nextColor = getRandomAvatarColor();
    setAvatarColor(nextColor);
    setProfileSuccessMsg('기본 아바타 배경색이 변경되었습니다. [프로필 저장]을 눌러 서버에 반영하세요.');
    setTimeout(() => setProfileSuccessMsg(null), 3000);
  };

  // Handle Remove Avatar Image (Revert to initial avatar)
  const handleRemoveAvatar = () => {
    if (confirm('등록된 아바타 이미지를 삭제하고 기본 이니셜 아바타로 복원하시겠습니까?')) {
      setAvatar(null);
      setProfileSuccessMsg('아바타 이미지가 제거되었습니다. [프로필 저장]을 눌러 서버에 반영하세요.');
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await executeAction(
      async () => {
        const updated = await updateUser(user.id, {
          name: name.trim(),
          avatar,
          avatarColor,
        });
        updateUserLocal(updated);
        return updated;
      },
      {
        onSuccess: () => {
          setProfileSuccessMsg('프로필 및 아바타 설정이 성공적으로 저장되었습니다.');
          setTimeout(() => setProfileSuccessMsg(null), 3000);
        },
      }
    );
  };

  // Handle Create Custom Field
  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldKey.trim() || !fieldName.trim()) return;

    await executeAction(
      async () => {
        return await createCustomField({
          key: fieldKey.trim().toLowerCase().replace(/\s+/g, '_'),
          name: fieldName.trim(),
          fieldType,
          description: fieldDesc.trim() || undefined,
          isRequired: fieldRequired,
        });
      },
      {
        onSuccess: (newField) => {
          setCustomFields((prev) => [...prev, newField]);
          setFieldKey('');
          setFieldName('');
          setFieldDesc('');
          setFieldRequired(false);
          setShowFieldForm(false);
        },
      }
    );
  };

  // Save Preferences to LocalStorage & Backend User Record
  const savePreferencesToServer = async (patch: Record<string, any>) => {
    if (!user?.id) return;
    try {
      let currentPrefs: Record<string, any> = {};
      if (user.preferences) {
        try {
          currentPrefs = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences;
        } catch (e) {}
      }
      const updated = {
        ...currentPrefs,
        ...patch,
      };
      const updatedStr = JSON.stringify(updated);
      const res = await updateUser(user.id, { preferences: updatedStr });
      if (res && res.preferences) {
        updateUserLocal({ ...user, preferences: res.preferences });
      }
    } catch (err) {
      console.error('Failed to sync preferences to backend:', err);
    }
  };

  // Handle Delete Custom Field
  const handleDeleteCustomField = async (id: number) => {
    if (!confirm('이 커스텀 필드를 삭제하시겠습니까?')) return;
    try {
      await deleteCustomField(id);
      setCustomFields((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || '필드 삭제 중 오류가 발생했습니다.');
    }
  };

  // Save Display Preferences
  const handleToggleCompactCards = (val: boolean) => {
    setCompactCards(val);
    localStorage.setItem('pref_compact_cards', String(val));
    savePreferencesToServer({ compactCards: val });
  };


  const handleChangeDefaultPriority = (val: number) => {
    setDefaultPriority(val);
    localStorage.setItem('pref_default_priority', String(val));
    setPrioritySavedFeedback(true);
    savePreferencesToServer({ defaultPriority: val });
    setTimeout(() => setPrioritySavedFeedback(false), 2000);
  };

  const handleChangeWeekStart = (sundayStart: boolean) => {
    setIsSundayStart(sundayStart);
    localStorage.setItem('pref_is_sunday_start', String(sundayStart));
    setWeekStartSavedFeedback(true);
    savePreferencesToServer({ isSundayStart: sundayStart });
    setTimeout(() => setWeekStartSavedFeedback(false), 2000);
  };

  const handleToggleDesktopNotifications = async (val: boolean) => {
    setDesktopNotifications(val);
    localStorage.setItem('pref_desktop_notifications', String(val));
    savePreferencesToServer({ desktopNotifications: val });
    if (val && !window.electronAPI?.isElectron) {
      await requestWebNotificationPermission();
    }
  };

  const handleSendTestNotification = async () => {
    setTestNotificationSent(true);
    await sendDesktopNotification({
      title: 'AntiGravity 알림 테스트',
      body: 'Electron 데스크톱 OS 네이티브 알림이 성공적으로 활성화되었습니다! 🚀',
      priority: 'CRITICAL',
    });
    setTimeout(() => setTestNotificationSent(false), 2500);
  };

  // Organization Handlers
  const handleToggleExpandGroup = (id: number) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return alert('그룹명을 입력해주세요.');

    await executeAction(
      async () => {
        return await createGroup({
          name: newGroupName.trim(),
          code: newGroupCode.trim() || undefined,
          description: newGroupDesc.trim() || undefined,
          parentId: groupParentId ? Number(groupParentId) : null,
        });
      },
      {
        onSuccess: (newGrp) => {
          setShowGroupForm(false);
          setNewGroupName('');
          setNewGroupCode('');
          setNewGroupDesc('');
          setGroupParentId(null);
          loadOrganizationData();
          if (newGrp) setSelectedGroupId(newGrp.id);
        },
      }
    );
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('정말 이 그룹을 삭제하시겠습니까? (하위 서브그룹도 함께 삭제됩니다)')) return;
    try {
      await deleteGroup(id);
      if (selectedGroupId === id) setSelectedGroupId(null);
      loadOrganizationData();
    } catch (err: any) {
      alert(err.response?.data?.error || '그룹 삭제에 실패했습니다.');
    }
  };

  const handleAddMemberToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newMemberUserId) return alert('추가할 사용자를 선택해주세요.');

    try {
      await addGroupMember(selectedGroupId, {
        userId: Number(newMemberUserId),
        role: newMemberRole,
        title: newMemberTitle.trim() || undefined,
      });
      setShowMemberForm(false);
      setNewMemberUserId('');
      setNewMemberRole('MEMBER');
      setNewMemberTitle('');
      loadOrganizationData();
    } catch (err: any) {
      alert(err.response?.data?.error || '그룹원 추가에 실패했습니다.');
    }
  };

  const handleRemoveMemberFromGroup = async (groupId: number, userId: number) => {
    if (!confirm('해당 사용자를 그룹에서 제외하시겠습니까?')) return;
    try {
      await removeGroupMember(groupId, userId);
      loadOrganizationData();
    } catch (err: any) {
      alert(err.response?.data?.error || '그룹원 제외 실패');
    }
  };

  const handleUpdateGroupMemberRole = async (groupId: number, userId: number, role: string) => {
    try {
      await updateGroupMember(groupId, userId, { role });
      loadOrganizationData();
      if (user && user.id === userId) {
        loadProfileData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '그룹 구성원 권한 변경에 실패했습니다.');
    }
  };

  const handleUpdateGroupMemberTitle = async (groupId: number, userId: number, currentTitle?: string | null) => {
    const newTitle = prompt('새 직책(Title)을 입력하세요:', currentTitle || '');
    if (newTitle === null) return;
    try {
      await updateGroupMember(groupId, userId, { title: newTitle.trim() });
      loadOrganizationData();
      if (user && user.id === userId) {
        loadProfileData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '직책 수정에 실패했습니다.');
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: 0 }}>
      {/* Top Title Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingsIcon size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            시스템 및 환경 설정 (Settings)
          </span>
        </div>
      </div>

      {/* Main Settings 2-Column Layout (Sidebar SubTabs + Content Area) */}
      <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}>
        {/* Left Sub-Tab Menu */}
        <div
          style={{
            width: '200px',
            flexShrink: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            padding: '6px',
          }}
        >
          <button
            onClick={() => setActiveSubTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              fontSize: '0.78rem',
              fontWeight: activeSubTab === 'profile' ? 600 : 400,
              background: activeSubTab === 'profile' ? '#37373d' : 'transparent',
              color: activeSubTab === 'profile' ? '#ffffff' : 'var(--text-main)',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <User size={14} color={activeSubTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)'} />
            사용자 프로필
          </button>

          <button
            onClick={() => setActiveSubTab('organization')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              fontSize: '0.78rem',
              fontWeight: activeSubTab === 'organization' ? 600 : 400,
              background: activeSubTab === 'organization' ? '#37373d' : 'transparent',
              color: activeSubTab === 'organization' ? '#ffffff' : 'var(--text-main)',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Building2 size={14} color={activeSubTab === 'organization' ? 'var(--primary)' : 'var(--text-muted)'} />
            조직도 및 권한 관리
          </button>

          <button
            onClick={() => setActiveSubTab('customFields')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              fontSize: '0.78rem',
              fontWeight: activeSubTab === 'customFields' ? 600 : 400,
              background: activeSubTab === 'customFields' ? '#37373d' : 'transparent',
              color: activeSubTab === 'customFields' ? '#ffffff' : 'var(--text-main)',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Sliders size={14} color={activeSubTab === 'customFields' ? 'var(--primary)' : 'var(--text-muted)'} />
            이슈 커스텀 필드
          </button>


          <button
            onClick={() => setActiveSubTab('display')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              fontSize: '0.78rem',
              fontWeight: activeSubTab === 'display' ? 600 : 400,
              background: activeSubTab === 'display' ? '#37373d' : 'transparent',
              color: activeSubTab === 'display' ? '#ffffff' : 'var(--text-main)',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Palette size={14} color={activeSubTab === 'display' ? 'var(--primary)' : 'var(--text-muted)'} />
            디스플레이 & 테마
          </button>

          <button
            onClick={() => setActiveSubTab('system')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              fontSize: '0.78rem',
              fontWeight: activeSubTab === 'system' ? 600 : 400,
              background: activeSubTab === 'system' ? '#37373d' : 'transparent',
              color: activeSubTab === 'system' ? '#ffffff' : 'var(--text-main)',
              border: 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Server size={14} color={activeSubTab === 'system' ? 'var(--primary)' : 'var(--text-muted)'} />
            시스템 상태 & 정보
          </button>
        </div>

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
          {/* ================= TAB 1: PROFILE ================= */}
          {activeSubTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '640px' }}>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                  사용자 프로필 및 계정 관리
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  현재 워크스페이스에 표시되는 사용자 이름, 계정 정보 및 소속 그룹을 확인하고 수정합니다.
                </p>
              </div>

              {!isAuthenticated ? (
                <div style={{ padding: '24px', textAlign: 'center', background: '#2d2d2d', borderRadius: 'var(--radius-xs)' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                    로그인되지 않은 게스트 상태입니다. 프로필을 확인하고 변경하려면 먼저 로그인해 주세요.
                  </p>
                  {onOpenAuth && (
                    <Button variant="primary" size="sm" onClick={onOpenAuth}>
                      로그인 / 회원가입 창 열기
                    </Button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {profileSuccessMsg && (
                    <div
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(78, 201, 176, 0.15)',
                        border: '1px solid rgba(78, 201, 176, 0.3)',
                        borderRadius: 'var(--radius-xs)',
                        color: '#4ec9b0',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={14} />
                      {profileSuccessMsg}
                    </div>
                  )}

                  {/* Avatar & User Summary Card */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#252526',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <Avatar
                        user={user}
                        name={name || user?.name || user?.email}
                        size={48}
                        shape="rounded"
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                            {name || user?.name || '사용자'}
                          </span>
                          {user?.role === 'ADMIN' ? (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                background: 'rgba(230, 162, 60, 0.18)',
                                border: '1px solid rgba(230, 162, 60, 0.4)',
                                borderRadius: '10px',
                                color: '#e6a23c',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontWeight: 600,
                              }}
                            >
                              <Shield size={10} />
                              시스템 관리자 (ADMIN)
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                background: '#333',
                                borderRadius: '10px',
                                color: 'var(--text-sub)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <User size={10} />
                              일반 사용자 (MEMBER)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {user?.email} (User ID: #{user?.id})
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-sub)',
                          background: '#1e1e1e',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #333',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Building2 size={12} color="var(--primary)" />
                        소속 그룹: <strong style={{ color: 'var(--text-bright)' }}>{user?.groupMemberships?.length || 0}</strong>개
                      </span>
                    </div>
                  </div>

                  {/* Profile Edit Form */}
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Avatar Management Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#252526', padding: '14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Camera size={14} color="var(--primary)" />
                          사용자 아바타 (프로필 이미지) 설정
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          최대 2MB PNG 지원 (256x256 정사각형 최적화)
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Avatar Large Preview */}
                        <div style={{ position: 'relative' }}>
                          <Avatar
                            avatar={avatar}
                            avatarColor={avatarColor}
                            name={name}
                            email={email}
                            size={76}
                            shape="rounded"
                            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)' }}
                          />
                          {avatar && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '-4px',
                                right: '-4px',
                                background: 'var(--primary)',
                                color: '#fff',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '10px',
                                border: '1px solid #1e1e1e',
                              }}
                            >
                              PNG
                            </span>
                          )}
                        </div>

                        {/* Avatar Info & Action Toolbar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '220px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>
                            {avatar ? (
                              <span style={{ color: '#4ec9b0', fontWeight: 600 }}>
                                ✓ 256x256 커스텀 PNG 아바타가 적용되어 있습니다.
                              </span>
                            ) : (
                              <span>
                                현재 기본 이니셜 아바타 모드입니다. 배경색은 랜덤 변경이 가능하며 이미지를 업로드할 수 있습니다.
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleAvatarFileSelect}
                              accept="image/png, image/jpeg, image/webp, image/*"
                              style={{ display: 'none' }}
                            />

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                            >
                              <Camera size={13} />
                              아바타 이미지 변경 (크롭)
                            </Button>

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={handleRandomAvatarColor}
                              title="기본 아바타 배경 색상을 무작위로 변경합니다"
                              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                            >
                              <Dices size={13} color="#f59e0b" />
                              랜덤 배경색 변경
                            </Button>

                            {avatar && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleRemoveAvatar}
                                style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#f87171' }}
                              >
                                <Trash2 size={13} />
                                이미지 삭제
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', borderBottom: '1px solid #333', paddingBottom: '4px', marginTop: '2px' }}>
                      기본 정보 수정
                    </div>

                    <div className="form-group">
                      <label className="form-label">이메일 계정 (로그인 식별자)</label>
                      <input
                        type="email"
                        className="input-field"
                        value={email}
                        disabled={true}
                        style={{ opacity: 0.7, cursor: 'not-allowed' }}
                      />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                        * 이메일 주소는 고유 로그인 식별자로 변경할 수 없습니다.
                      </span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">사용자 이름 (Display Name)</label>
                      <input
                        type="text"
                        className="input-field"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름 또는 닉네임을 입력하세요"
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                      <Button type="submit" variant="primary" size="sm" icon={<Save size={13} />} isLoading={isPending}>
                        프로필 저장
                      </Button>
                    </div>
                  </form>

                  {/* ================= MY GROUPS SECTION ================= */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #333',
                        paddingBottom: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={15} color="var(--primary)" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                          현재 소속된 조직 및 그룹 (My Groups & Teams)
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            background: 'var(--primary)',
                            color: '#ffffff',
                            borderRadius: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {user?.groupMemberships?.length || 0}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={loadProfileData}
                        disabled={loadingProfile}
                        title="소속 그룹 정보 새로고침"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        <RefreshCw size={12} className={loadingProfile ? 'spin' : ''} />
                        새로고침
                      </button>
                    </div>

                    {loadingProfile ? (
                      <Spinner centered label="소속 그룹 정보 불러오는 중..." />
                    ) : user?.groupMemberships && user.groupMemberships.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {user.groupMemberships.map((membership) => {
                          const grp = membership.group;
                          const isLeader = membership.role === 'LEADER';
                          const hasParent = grp?.parent;

                          return (
                            <div
                              key={membership.id}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                padding: '12px 14px',
                                background: '#252526',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-xs)',
                                transition: 'border-color 0.15s ease',
                              }}
                            >
                              {/* 1st Row: Group Name, Code, and Role Badge */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <Building2 size={15} color={isLeader ? '#e6a23c' : 'var(--primary)'} />
                                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                                    {grp?.name || `그룹 #${membership.groupId}`}
                                  </span>
                                  {grp?.code && (
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '1px 5px',
                                        background: '#333',
                                        color: 'var(--text-sub)',
                                        borderRadius: '3px',
                                        fontFamily: 'monospace',
                                      }}
                                    >
                                      {grp.code}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {(() => {
                                    const roleUpper = (membership.role || 'MEMBER').toUpperCase();
                                    if (roleUpper === 'ADMIN' || roleUpper === 'LEADER') {
                                      return (
                                        <span
                                          style={{
                                            fontSize: '0.68rem',
                                            fontWeight: 600,
                                            padding: '2px 7px',
                                            background: 'rgba(230, 162, 60, 0.18)',
                                            border: '1px solid rgba(230, 162, 60, 0.4)',
                                            color: '#e6a23c',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                        >
                                          <Crown size={11} />
                                          관리자 (PM)
                                        </span>
                                      );
                                    } else if (roleUpper === 'VIEWER') {
                                      return (
                                        <span
                                          style={{
                                            fontSize: '0.68rem',
                                            fontWeight: 500,
                                            padding: '2px 7px',
                                            background: 'rgba(167, 139, 250, 0.15)',
                                            border: '1px solid rgba(167, 139, 250, 0.35)',
                                            color: '#a78bfa',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                        >
                                          <Shield size={11} />
                                          참석자 (리뷰어)
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <span
                                          style={{
                                            fontSize: '0.68rem',
                                            fontWeight: 500,
                                            padding: '2px 7px',
                                            background: 'rgba(78, 201, 176, 0.15)',
                                            border: '1px solid rgba(78, 201, 176, 0.35)',
                                            color: '#4ec9b0',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                        >
                                          <User size={11} />
                                          담당자 (개발자)
                                        </span>
                                      );
                                    }
                                  })()}
                                </div>
                              </div>

                              {/* 2nd Row: Hierarchy Breadcrumb */}
                              {hasParent && (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    paddingLeft: '2px',
                                  }}
                                >
                                  <Layers size={12} color="var(--text-muted)" />
                                  <span>상위 조직:</span>
                                  <span style={{ color: 'var(--text-sub)', fontWeight: 500 }}>
                                    {grp.parent?.name}
                                  </span>
                                  <span>&gt;</span>
                                  <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>
                                    {grp.name}
                                  </span>
                                </div>
                              )}

                              {/* 3rd Row: Title (직책) & Description */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {membership.title ? (
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        color: 'var(--text-main)',
                                        background: '#1e1e1e',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        border: '1px solid #3a3a3a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <Briefcase size={11} color="var(--primary)" />
                                      직책: <strong>{membership.title}</strong>
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                      직책 미설정
                                    </span>
                                  )}

                                  {grp?.description && (
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        color: 'var(--text-muted)',
                                        fontStyle: 'italic',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '320px',
                                        whiteSpace: 'nowrap',
                                      }}
                                      title={grp.description}
                                    >
                                      - {grp.description}
                                    </span>
                                  )}
                                </div>

                                {/* Link to Organization tab */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedGroupId(membership.groupId);
                                    setActiveSubTab('organization');
                                  }}
                                  style={{
                                    background: '#2d2d2d',
                                    border: '1px solid #3e3e42',
                                    borderRadius: 'var(--radius-xs)',
                                    color: 'var(--text-main)',
                                    padding: '3px 8px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#37373d';
                                    e.currentTarget.style.color = '#ffffff';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#2d2d2d';
                                    e.currentTarget.style.color = 'var(--text-main)';
                                  }}
                                >
                                  <span>조직도에서 확인</span>
                                  <ExternalLink size={11} />
                                </button>
                              </div>

                              {/* 4th Row: Joined Date */}
                              {membership.joinedAt && (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.68rem',
                                    color: 'var(--text-muted)',
                                    borderTop: '1px solid #2d2d2d',
                                    paddingTop: '6px',
                                    marginTop: '2px',
                                  }}
                                >
                                  <Clock size={10} />
                                  <span>
                                    소속 등록일:{' '}
                                    {new Date(membership.joinedAt).toLocaleDateString('ko-KR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '24px 16px',
                          background: '#252526',
                          border: '1px dashed #3e3e42',
                          borderRadius: 'var(--radius-xs)',
                          textAlign: 'center',
                          gap: '8px',
                        }}
                      >
                        <Building2 size={28} color="var(--text-muted)" />
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                          현재 소속된 조직 또는 그룹(부서/팀)이 없습니다.
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.4 }}>
                          조직도 관리에서 새로운 그룹을 생성하여 본인을 추가하거나, 소속 그룹 관리자에게 멤버 등록을 요청하세요.
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Building2 size={12} />}
                          onClick={() => setActiveSubTab('organization')}
                          style={{ marginTop: '4px' }}
                        >
                          조직도 및 권한 관리 바로가기
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: ORGANIZATION & ROLES ================= */}
          {activeSubTab === 'organization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              {/* Header Title & Top Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      setGroupParentId(null);
                      setNewGroupName('');
                      setNewGroupCode('');
                      setNewGroupDesc('');
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
                  <div
                    style={{
                      width: '320px',
                      flexShrink: 0,
                      background: '#252526',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-sub)', borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                      조직 계층 구조 (Hierarchy Tree)
                    </div>

                    {treeGroups.length === 0 ? (
                      <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        등록된 조직/그룹이 없습니다.<br />
                        상단의 [최상위 그룹 추가]를 클릭해 본부나 팀을 생성하세요.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {(() => {
                          const renderNode = (grp: Group, depth: number = 0): React.ReactNode => {
                            const isSelected = selectedGroupId === grp.id;
                            const hasChildren = (grp.childrenList && grp.childrenList.length > 0) || (grp.children && grp.children.length > 0);
                            const isExpanded = expandedGroupIds.has(grp.id);
                            const children = grp.childrenList || grp.children || [];

                            return (
                              <div key={grp.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                <div
                                  onClick={() => setSelectedGroupId(grp.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 8px',
                                    paddingLeft: `${depth * 14 + 6}px`,
                                    background: isSelected ? '#37373d' : 'transparent',
                                    borderRadius: 'var(--radius-xs)',
                                    cursor: 'pointer',
                                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                                    fontSize: '0.78rem',
                                    fontWeight: isSelected ? 600 : 400,
                                    transition: 'background 0.15s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                    {hasChildren ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleExpandGroup(grp.id);
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                                      >
                                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                      </button>
                                    ) : (
                                      <div style={{ width: '13px' }} />
                                    )}

                                    <Building2 size={13} color={depth === 0 ? 'var(--primary)' : '#4ec9b0'} />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {grp.name}
                                    </span>
                                    {grp.code && (
                                      <span style={{ fontSize: '0.68rem', padding: '1px 4px', background: '#333', borderRadius: '3px', color: 'var(--text-sub)' }}>
                                        {grp.code}
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                      {grp.members?.length || 0}명
                                    </span>
                                    <button
                                      title="하위 서브그룹 추가"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setGroupParentId(grp.id);
                                        setNewGroupName('');
                                        setNewGroupCode('');
                                        setNewGroupDesc('');
                                        setShowGroupForm(true);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-sub)',
                                        cursor: 'pointer',
                                        padding: '2px',
                                      }}
                                    >
                                      <Plus size={12} />
                                    </button>
                                    <button
                                      title="그룹 삭제"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteGroup(grp.id);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '2px',
                                      }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {hasChildren && isExpanded && (
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {children.map((child) => renderNode(child, depth + 1))}
                                  </div>
                                )}
                              </div>
                            );
                          };

                          return treeGroups.map((rootGrp) => renderNode(rootGrp, 0));
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Selected Group Info & Member Management */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                    {(() => {
                      const selectedGroup = flatGroups.find((g) => g.id === selectedGroupId) || flatGroups[0];
                      if (!selectedGroup) {
                        return (
                          <div style={{ padding: '30px', textAlign: 'center', background: '#252526', borderRadius: 'var(--radius-xs)', color: 'var(--text-muted)' }}>
                            선택된 그룹이 없습니다. 좌측 조직도에서 그룹을 선택하세요.
                          </div>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Group Detail Card */}
                          <div style={{ padding: '14px', background: '#252526', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                                    {selectedGroup.name}
                                  </h4>
                                  {selectedGroup.code && (
                                    <span style={{ fontSize: '0.72rem', padding: '2px 6px', background: '#333', color: 'var(--accent-cyan)', borderRadius: '3px', fontWeight: 600 }}>
                                      {selectedGroup.code}
                                    </span>
                                  )}
                                  {selectedGroup.parent && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                      (상위 그룹: {selectedGroup.parent.name})
                                    </span>
                                  )}
                                </div>
                                {selectedGroup.description && (
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '4px' }}>
                                    {selectedGroup.description}
                                  </p>
                                )}
                              </div>

                              <Button
                                variant="primary"
                                size="sm"
                                icon={<UserPlus size={13} />}
                                onClick={() => {
                                  setNewMemberUserId('');
                                  setNewMemberRole('MEMBER');
                                  setNewMemberTitle('');
                                  setShowMemberForm(true);
                                }}
                              >
                                팀원 배정 / 직책 부여
                              </Button>
                            </div>
                          </div>

                          {/* Group Members List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Users size={14} color="var(--primary)" />
                                소속 구성원 목록 ({selectedGroup.members?.length || 0}명)
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                * 그룹 내 권한: 관리자(PM) / 담당자(개발자) / 참석자(리뷰어)
                              </span>
                            </div>

                            {(!selectedGroup.members || selectedGroup.members.length === 0) ? (
                              <div style={{ padding: '24px', textAlign: 'center', background: '#252526', borderRadius: 'var(--radius-xs)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                이 그룹에 배정된 구성원이 없습니다. [팀원 배정 / 직책 부여] 버튼으로 구성원을 추가하세요.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedGroup.members.map((m: GroupMember) => {
                                  const roleUpper = (m.role || 'MEMBER').toUpperCase();
                                  const currentRoleValue = (roleUpper === 'LEADER' || roleUpper === 'ADMIN') ? 'ADMIN' : (roleUpper === 'VIEWER' ? 'VIEWER' : 'MEMBER');

                                  return (
                                    <div
                                      key={m.id}
                                      style={{
                                        padding: '10px 14px',
                                        background: '#2d2d2d',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-xs)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      {/* User Info */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
                                        <Avatar
                                          user={m.user}
                                          size={32}
                                          shape="rounded"
                                          style={{
                                            border: `2px solid ${
                                              currentRoleValue === 'ADMIN'
                                                ? '#f59e0b'
                                                : (currentRoleValue === 'VIEWER' ? '#a78bfa' : 'var(--primary)')
                                            }`,
                                          }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                                            {m.user?.name || '(이름 없음)'}
                                          </div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {m.user?.email}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Title & Edit */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span
                                          style={{
                                            fontSize: '0.72rem',
                                            color: m.title ? 'var(--text-main)' : 'var(--text-muted)',
                                            background: '#222',
                                            padding: '3px 8px',
                                            borderRadius: '3px',
                                            border: '1px solid #3a3a3a',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                        >
                                          <Briefcase size={11} color="var(--primary)" />
                                          {m.title || '직책 미설정'}
                                        </span>
                                        <button
                                          type="button"
                                          title="직책 수정"
                                          onClick={() => handleUpdateGroupMemberTitle(selectedGroup.id, m.userId, m.title)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-sub)',
                                            cursor: 'pointer',
                                            padding: '3px',
                                            borderRadius: '3px',
                                            display: 'flex',
                                          }}
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                      </div>

                                      {/* Group Role Selector & Actions */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>그룹 권한:</span>
                                          <select
                                            className="input-field"
                                            value={currentRoleValue}
                                            onChange={(e) => handleUpdateGroupMemberRole(selectedGroup.id, m.userId, e.target.value)}
                                            style={{
                                              fontSize: '0.74rem',
                                              padding: '3px 8px',
                                              height: '28px',
                                              width: '140px',
                                              borderRadius: 'var(--radius-xs)',
                                              background: currentRoleValue === 'ADMIN'
                                                ? 'rgba(230, 162, 60, 0.15)'
                                                : (currentRoleValue === 'VIEWER' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(78, 201, 176, 0.15)'),
                                              borderColor: currentRoleValue === 'ADMIN'
                                                ? 'rgba(230, 162, 60, 0.4)'
                                                : (currentRoleValue === 'VIEWER' ? 'rgba(167, 139, 250, 0.4)' : 'rgba(78, 201, 176, 0.4)'),
                                              color: currentRoleValue === 'ADMIN'
                                                ? '#e6a23c'
                                                : (currentRoleValue === 'VIEWER' ? '#a78bfa' : '#4ec9b0'),
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                            }}
                                          >
                                            <option value="ADMIN" style={{ background: '#252526', color: '#e6a23c' }}>
                                              👑 1. 관리자 (PM)
                                            </option>
                                            <option value="MEMBER" style={{ background: '#252526', color: '#4ec9b0' }}>
                                              💻 2. 담당자 (개발자)
                                            </option>
                                            <option value="VIEWER" style={{ background: '#252526', color: '#a78bfa' }}>
                                              👁️ 3. 참석자 (리뷰어)
                                            </option>
                                          </select>
                                        </div>

                                        <button
                                          title="그룹에서 제외"
                                          onClick={() => handleRemoveMemberFromGroup(selectedGroup.id, m.userId)}
                                          style={{
                                            background: '#382222',
                                            border: '1px solid #5a2e2e',
                                            color: '#f87171',
                                            cursor: 'pointer',
                                            padding: '4px 8px',
                                            borderRadius: 'var(--radius-xs)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.7rem',
                                          }}
                                        >
                                          <Trash2 size={12} />
                                          제외
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Group Create/SubGroup Modal */}
              {showGroupForm && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                  <div className="modal-container" style={{ maxWidth: '420px', background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-main)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '12px' }}>
                      {groupParentId ? '🏢 신규 서브그룹 (하위 부서/팀) 생성' : '🏢 신규 최상위 그룹 (본부) 생성'}
                    </h4>

                    <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {groupParentId && (
                        <div className="form-group">
                          <label className="form-label">상위 그룹</label>
                          <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, padding: '6px 10px', background: '#252526', borderRadius: 'var(--radius-xs)' }}>
                            {flatGroups.find((g) => g.id === groupParentId)?.name || '상위 그룹'}
                          </div>
                        </div>
                      )}

                      <div className="form-group">
                        <label className="form-label">그룹/부서명 *</label>
                        <input
                          type="text"
                          className="input-field"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="예: 플랫폼개발팀, 프론트엔드 파트"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">그룹 코드 (영문 약어)</label>
                        <input
                          type="text"
                          className="input-field"
                          value={newGroupCode}
                          onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                          placeholder="예: DEV, PLATFORM, FE"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">그룹 설명</label>
                        <textarea
                          className="input-field"
                          rows={2}
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          placeholder="부서 및 팀 업무 소개..."
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setShowGroupForm(false)}>
                          취소
                        </Button>
                        <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
                          생성 완료
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Assign Member Modal */}
              {showMemberForm && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                  <div className="modal-container" style={{ maxWidth: '420px', background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-main)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '12px' }}>
                      👤 팀원 배정 및 직책/권한 설정
                    </h4>

                    <form onSubmit={handleAddMemberToGroup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label">대상 사용자 선택 *</label>
                        <select
                          className="input-field"
                          value={newMemberUserId}
                          onChange={(e) => setNewMemberUserId(Number(e.target.value))}
                          required
                        >
                          <option value="">-- 사용자를 선택하세요 --</option>
                          {allUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name ? `${u.name} (${u.email})` : u.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">그룹(조직) 내 권한 *</label>
                        <select
                          className="input-field"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                        >
                          <option value="ADMIN">👑 1. 관리자 (PM)</option>
                          <option value="MEMBER">💻 2. 담당자 (개발자)</option>
                          <option value="VIEWER">👁️ 3. 참석자 (리뷰어)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">직책 (Title)</label>
                        <input
                          type="text"
                          className="input-field"
                          value={newMemberTitle}
                          onChange={(e) => setNewMemberTitle(e.target.value)}
                          placeholder="예: 수석연구원, 테크리드, 개발자"
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setShowMemberForm(false)}>
                          취소
                        </Button>
                        <Button type="submit" variant="primary" size="sm">
                          배정 완료
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: CUSTOM FIELDS ================= */}
          {activeSubTab === 'customFields' && (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                    이슈 사용자 정의 필드 (Custom Fields)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    이슈 등록 및 상세 화면에서 사용할 커스텀 데이터 필드를 정의하고 관리합니다.
                  </p>
                </div>
                {isAuthenticated && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={13} />}
                    onClick={() => setShowFieldForm(!showFieldForm)}
                  >
                    {showFieldForm ? '닫기' : '새 필드 추가'}
                  </Button>
                )}
              </div>

              {/* Add Custom Field Form */}
              {showFieldForm && (
                <form
                  onSubmit={handleCreateCustomField}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '12px',
                    background: '#2d2d2d',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                    신규 커스텀 필드 생성
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">필드 키 (Key, 영문)</label>
                      <input
                        type="text"
                        className="input-field"
                        value={fieldKey}
                        onChange={(e) => setFieldKey(e.target.value)}
                        placeholder="e.g. env_type, severity"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">표시 이름 (Name)</label>
                      <input
                        type="text"
                        className="input-field"
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                        placeholder="e.g. 발생 환경, 심각도"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">데이터 유형 (Type)</label>
                      <select
                        className="input-field"
                        value={fieldType}
                        onChange={(e) => setFieldType(e.target.value)}
                      >
                        <option value="STRING">문자열 (STRING)</option>
                        <option value="NUMBER">숫자 (NUMBER)</option>
                        <option value="DATE">날짜 (DATE)</option>
                        <option value="SELECT">선택형 (SELECT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">설명 (Description)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={fieldDesc}
                      onChange={(e) => setFieldDesc(e.target.value)}
                      placeholder="필드 용도에 대한 간단한 설명을 입력하세요"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={fieldRequired}
                        onChange={(e) => setFieldRequired(e.target.checked)}
                      />
                      필수 입력 항목으로 지정
                    </label>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button variant="secondary" size="sm" onClick={() => setShowFieldForm(false)}>
                        취소
                      </Button>
                      <Button type="submit" variant="primary" size="sm" icon={<Plus size={13} />} isLoading={isPending}>
                        생성
                      </Button>
                    </div>

                  </div>
                </form>
              )}

              {/* Custom Fields List */}
              {loadingFields ? (
                <Spinner centered label="커스텀 필드 목록 불러오는 중..." />
              ) : customFields.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  등록된 사용자 정의 필드가 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {customFields.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#2d2d2d',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '0.82rem' }}>
                          {field.name}
                        </span>
                        <code style={{ fontSize: '0.7rem', color: 'var(--primary)', background: '#1e1e1e', padding: '1px 5px', borderRadius: '2px' }}>
                          {field.key}
                        </code>
                        <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', background: 'rgba(0,122,204,0.15)', padding: '1px 5px', borderRadius: '2px' }}>
                          {field.fieldType}
                        </span>
                        {field.isRequired && (
                          <span style={{ fontSize: '0.65rem', color: '#f14c4c', fontWeight: 700 }}>
                            (필수)
                          </span>
                        )}
                        {field.description && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                            - {field.description}
                          </span>
                        )}
                      </div>

                      {isAuthenticated && (
                        <button
                          onClick={() => handleDeleteCustomField(field.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: DISPLAY & NOTIFICATIONS ================= */}
          {activeSubTab === 'display' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                  디스플레이 및 데스크톱 알림 설정
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  이슈 칸반 보드 스타일 및 Electron 데스크톱 OS 네이티브 알림 설정을 관리합니다.
                </p>
              </div>

              {/* Desktop OS Notification Option */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '12px',
                  background: '#2d2d2d',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={14} color="var(--primary)" />
                      데스크톱 OS 네이티브 알림 (Desktop Notification)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      신규 이슈 등록, 댓글 작성, 중요 긴급 이슈 알림 시 윈도우 데스크톱 토스트 알림을 수신합니다.
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={desktopNotifications}
                      onChange={(e) => handleToggleDesktopNotifications(e.target.checked)}
                    />
                    <span style={{ fontSize: '0.78rem', color: desktopNotifications ? '#4ec9b0' : 'var(--text-muted)', fontWeight: 600 }}>
                      {desktopNotifications ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #3c3c3c', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                    실제 OS 데스크톱 토스트 알림이 오는지 테스트해보세요.
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Bell size={12} />}
                    onClick={handleSendTestNotification}
                    disabled={!desktopNotifications}
                  >
                    {testNotificationSent ? '알림 전송 완료! 🔔' : '테스트 알림 보내기'}
                  </Button>
                </div>
              </div>

              {/* Default Priority Option */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#2d2d2d',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>신규 이슈 기본 우선순위 (Default Priority)</span>
                    {prioritySavedFeedback && (
                      <span style={{ fontSize: '0.68rem', color: '#4ec9b0', background: 'rgba(78, 201, 176, 0.15)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                        ✓ 저장됨
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    새 이슈 생성 창을 열었을 때 기본으로 선택될 우선순위
                  </div>
                </div>

                <div style={{ width: '140px' }}>
                  <PrioritySelect value={defaultPriority} onChange={handleChangeDefaultPriority} />
                </div>
              </div>

              {/* Week Start Day Option (일요일 시작 / 월요일 시작) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#2d2d2d',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>주 시작 요일 설정 (Week Start Day)</span>
                    {weekStartSavedFeedback && (
                      <span style={{ fontSize: '0.68rem', color: '#4ec9b0', background: 'rgba(78, 201, 176, 0.15)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                        ✓ 저장됨
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    WBS 간트 차트 및 주차 계산 시 기준이 되는 주의 시작 요일 (일요일 / 월요일)
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: '#1e1e1e', padding: '3px', borderRadius: '4px', border: '1px solid #3c3c3c' }}>
                  <button
                    type="button"
                    onClick={() => handleChangeWeekStart(true)}
                    style={{
                      background: isSundayStart ? 'var(--primary)' : 'transparent',
                      color: isSundayStart ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '3px 9px',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      fontWeight: isSundayStart ? 600 : 400,
                    }}
                  >
                    일요일 시작
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeWeekStart(false)}
                    style={{
                      background: !isSundayStart ? 'var(--primary)' : 'transparent',
                      color: !isSundayStart ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '3px 9px',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      fontWeight: !isSundayStart ? 600 : 400,
                    }}
                  >
                    월요일 시작
                  </button>
                </div>
              </div>

              {/* Compact Cards Option */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#2d2d2d',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                    고밀도 칸반 카드 모드 (Compact Density)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    칸반 카드의 패딩을 줄여 한 화면에 더 많은 이슈를 표시합니다.
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={compactCards}
                    onChange={(e) => handleToggleCompactCards(e.target.checked)}
                  />
                  <span style={{ fontSize: '0.78rem', color: compactCards ? '#4ec9b0' : 'var(--text-muted)', fontWeight: 600 }}>
                    {compactCards ? 'ON' : 'OFF'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ================= TAB 4: SYSTEM INFO ================= */}
          {activeSubTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '560px' }}>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                  시스템 상태 및 버전 정보
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  AntiGravity Workflow REST API 서버 및 데스크톱 런타임 상태를 확인합니다.
                </p>
              </div>

              {healthLoading ? (
                <Spinner centered label="서버 상태 진단 중..." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>애플리케이션 런타임</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: window.electronAPI?.isElectron ? '#4ec9b0' : 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Monitor size={13} /> {window.electronAPI?.isElectron ? 'Electron Desktop Framework (Active)' : 'Web Browser Client (Active)'}
                    </span>
                  </div>

                  <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>서버 헬스체크 상태</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4ec9b0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={13} /> {health?.status || 'OK (Active)'}
                    </span>
                  </div>

                  <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>데이터베이스 (Prisma SQLite)</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={13} /> 연결 정상 (Ready)
                    </span>
                  </div>

                  <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>백엔드 API 서버 주소</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {localStorage.getItem('pref_backend_api_url') || 'http://localhost:4000 (기본 로컬 서버)'}
                    </span>
                  </div>

                  <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>시스템 버전</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                      AntiGravity Workflow v2.4.0 (Desktop Edition)
                    </span>
                  </div>

                  <div style={{ padding: '10px 12px', background: '#2d2d2d', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>인증 방식</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                      JWT Bearer Token Signature Only
                    </span>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <AvatarCropModal
        isOpen={showCropModal}
        imageSrc={cropImageSrc}
        fileName={cropFileName}
        onClose={() => {
          setShowCropModal(false);
          setCropImageSrc(null);
        }}
        onCropComplete={handleCropComplete}
      />

      <ActionFeedbackModal
        state={errorState}
        onClose={closeErrorModal}
      />
    </div>
  );
};

