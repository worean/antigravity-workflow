// -*- coding: utf-8 -*-
import React, { useRef } from 'react';
import type { User as UserType } from '../../types';
import {
  Camera,
  Dices,
  Trash2,
  Save,
  Building2,
  RefreshCw,
  Crown,
  Briefcase,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Button, Spinner, Avatar, getRandomAvatarColor } from '../common';

interface SettingsProfileTabProps {
  user: UserType | null;
  name: string;
  setName: (name: string) => void;
  email: string;
  avatar: string | null;
  setAvatar: (avatar: string | null) => void;
  avatarColor: string | null;
  setAvatarColor: (color: string | null) => void;
  profileSuccessMsg: string | null;
  loadingProfile: boolean;
  isPending: boolean;
  handleSaveProfile: (e: React.FormEvent) => void;
  loadProfileData: () => Promise<void>;
  setSelectedGroupId: (groupId: number) => void;
  setActiveSubTab: (tab: any) => void;
  onOpenCropModal: (imageSrc: string, fileName: string) => void;
}

export const SettingsProfileTab: React.FC<SettingsProfileTabProps> = ({
  user,
  name,
  setName,
  email,
  avatar,
  setAvatar,
  avatarColor,
  setAvatarColor,
  profileSuccessMsg,
  loadingProfile,
  isPending,
  handleSaveProfile,
  loadProfileData,
  setSelectedGroupId,
  setActiveSubTab,
  onOpenCropModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, WebP 등)만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기는 최대 10MB 이하만 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onOpenCropModal(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRandomAvatarColor = () => {
    const newColor = getRandomAvatarColor();
    setAvatarColor(newColor);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '640px' }}>
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          사용자 프로필 및 계정 관리
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          개인 프로필 정보, 커스텀 아바타 이미지 및 소속된 조직/그룹 현황을 확인하고 수정합니다.
        </p>
      </div>

      {profileSuccessMsg && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(78, 201, 176, 0.15)',
            border: '1px solid #4ec9b0',
            borderRadius: 'var(--radius-xs)',
            color: '#4ec9b0',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {profileSuccessMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Avatar Edit Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '14px',
              background: '#252526',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '4px' }}>
              프로필 아바타 이미지
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Avatar
                  user={{
                    id: user?.id || 0,
                    name: name || user?.name || 'User',
                    email: email,
                    avatar: avatar,
                    avatarColor: avatarColor,
                  }}
                  size={56}
                  shape="circle"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {avatar ? (
                    <span style={{ color: 'var(--accent-cyan)' }}>커스텀 프로필 이미지가 등록되어 있습니다.</span>
                  ) : (
                    <span>등록된 이미지가 없어 기본 텍스트 이니셜 아바타가 표시됩니다.</span>
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

        {/* MY GROUPS SECTION */}
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
                                }}
                              >
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
                                  background: 'rgba(0, 122, 204, 0.15)',
                                  border: '1px solid rgba(0, 122, 204, 0.35)',
                                  color: 'var(--accent-cyan)',
                                  borderRadius: '4px',
                                }}
                              >
                                담당자 (멤버)
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>

                    {/* 2nd Row: Parent Hierarchy Breadcrumb */}
                    {hasParent && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          paddingLeft: '4px',
                        }}
                      >
                        <span style={{ color: 'var(--text-sub)', fontWeight: 500 }}>
                          {grp.parent?.name}
                        </span>
                        <span>&gt;</span>
                        <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>
                          {grp.name}
                        </span>
                      </div>
                    )}

                    {/* 3rd Row: Title & Description */}
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
    </div>
  );
};