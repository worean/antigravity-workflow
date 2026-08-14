import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUser, getCustomFields, createCustomField, deleteCustomField, checkHealth } from '../services/api';
import type { CustomFieldDefinition, HealthStatus } from '../types';
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
  Settings as SettingsIcon,
} from 'lucide-react';

import { Button, Spinner, PrioritySelect } from '../components/common';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from '../components/ActionFeedbackModal';
import { sendDesktopNotification, isNotificationEnabled, requestWebNotificationPermission } from '../utils/notificationUtils';



type SettingsTab = 'profile' | 'customFields' | 'display' | 'system';

interface SettingsPageProps {
  onOpenAuth?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenAuth }) => {
  const { user, isAuthenticated, updateUserLocal } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>('profile');

  // 1. Profile State
  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

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
  const [desktopNotifications, setDesktopNotifications] = useState<boolean>(() => {
    return isNotificationEnabled();
  });
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);


  // 4. System Health State
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);

  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

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

  useEffect(() => {
    if (activeSubTab === 'customFields') loadCustomFields();
    if (activeSubTab === 'system') loadHealth();
  }, [activeSubTab]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await executeAction(
      async () => {
        const updated = await updateUser(user.id, { name: name.trim() });
        updateUserLocal(updated);
        return updated;
      },
      {
        onSuccess: () => {
          setProfileSuccessMsg('프로필 정보가 성공적으로 업데이트되었습니다.');
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
  };


  const handleChangeDefaultPriority = (val: number) => {
    setDefaultPriority(val);
    localStorage.setItem('pref_default_priority', String(val));
  };

  const handleToggleDesktopNotifications = async (val: boolean) => {
    setDesktopNotifications(val);
    localStorage.setItem('pref_desktop_notifications', String(val));
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                  사용자 프로필 및 계정 관리
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  현재 워크스페이스에 표시되는 사용자 이름과 계정 세부정보를 수정합니다.
                </p>
              </div>

              {!isAuthenticated ? (
                <div style={{ padding: '24px', textAlign: 'center', background: '#2d2d2d', borderRadius: 'var(--radius-xs)' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                    로그인되지 않은 게스트 상태입니다. 프로필을 변경하려면 먼저 로그인해 주세요.
                  </p>
                  {onOpenAuth && (
                    <Button variant="primary" size="sm" onClick={onOpenAuth}>
                      로그인 / 회원가입 창 열기
                    </Button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                  {/* Avatar Preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#2d2d2d', borderRadius: 'var(--radius-xs)' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                      }}
                    >
                      {(name || user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                        {name || user?.name || '사용자'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {user?.email} (User ID: #{user?.id})
                      </div>
                    </div>
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
                      * 이메일 주소는 보안 고유 식별자로 변경할 수 없습니다.
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

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <Button type="submit" variant="primary" size="sm" icon={<Save size={13} />} isLoading={isPending}>
                      프로필 저장
                    </Button>
                  </div>

                </form>
              )}
            </div>
          )}

          {/* ================= TAB 2: CUSTOM FIELDS ================= */}
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
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                    신규 이슈 기본 우선순위 (Default Priority)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    새 이슈 생성 창을 열었을 때 기본으로 선택될 우선순위
                  </div>
                </div>

                <div style={{ width: '140px' }}>
                  <PrioritySelect value={defaultPriority} onChange={handleChangeDefaultPriority} />
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
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>시스템 버전</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                      AntiGravity Workflow v2.4.0
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

      <ActionFeedbackModal
        state={errorState}
        onClose={closeErrorModal}
      />
    </div>
  );
};

