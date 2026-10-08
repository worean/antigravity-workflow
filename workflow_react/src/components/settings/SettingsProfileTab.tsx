import React, { useRef } from 'react';
import type { User as UserType } from '@/types';
import { Camera, Dices, Trash2, Save } from 'lucide-react';
import { Button, Avatar, getRandomAvatarColor } from '@/components/common';
import { ProfileGroupList } from './ProfileGroupList';

interface SettingsProfileTabProps {
  user: UserType | null;
  name: string;
  setName: (name: string) => void;
  email: string;
  avatar: string | null;
  setAvatar: (avatar: string | null) => void;
  avatarColor: string | null;
  setAvatarColor: (color: string | null) => void;
  bio: string;
  setBio: (bio: string) => void;
  department: string;
  setDepartment: (dept: string) => void;
  jobTitle: string;
  setJobTitle: (title: string) => void;
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
  bio,
  setBio,
  department,
  setDepartment,
  jobTitle,
  setJobTitle,
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
              background: 'var(--bg-card)',
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

          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px', marginTop: '2px' }}>
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

          {/* Department & Job Title 2-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">소속 부서 (Department)</label>
              <input
                type="text"
                className="input-field"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예: 플랫폼개발팀, 디자인팀"
                maxLength={100}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">직책 / 직급 (Job Title)</label>
              <input
                type="text"
                className="input-field"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="예: 테크리드, 시니어 엔지니어"
                maxLength={100}
              />
            </div>
          </div>

          {/* Bio / Description Textarea */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>자기 설명 및 소개 (Bio)</label>
              <span style={{ fontSize: '0.68rem', color: bio.length > 480 ? 'var(--accent-rose, #f43f5e)' : 'var(--text-muted)' }}>
                {bio.length} / 500자
              </span>
            </div>
            <textarea
              className="input-field"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              placeholder="담당 업무, 전문 분야, 자기소개 등을 자유롭게 기입하세요."
              rows={3}
              style={{
                width: '100%',
                resize: 'vertical',
                lineHeight: 1.45,
                fontSize: '0.78rem',
                fontFamily: 'inherit',
              }}
              maxLength={500}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
            <Button type="submit" variant="primary" size="sm" icon={<Save size={13} />} isLoading={isPending}>
              프로필 저장
            </Button>
          </div>
        </form>

        {/* MY GROUPS SECTION (Modular Sub-Component) */}
        <ProfileGroupList
          user={user}
          loadingProfile={loadingProfile}
          loadProfileData={loadProfileData}
          setSelectedGroupId={setSelectedGroupId}
          setActiveSubTab={setActiveSubTab}
        />
      </div>
    </div>
  );
};