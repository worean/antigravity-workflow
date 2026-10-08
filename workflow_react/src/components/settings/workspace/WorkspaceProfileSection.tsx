﻿import React, { useRef } from 'react';
import { Edit2, Camera, Trash2 } from 'lucide-react';
import type { Workspace } from '@/types';
import { WorkspaceSymbol } from './WorkspaceSymbol';

const DEFAULT_ICONS = ['🚀', '🏢', '⚡', '🌟', '💻', '🎯', '🔥', '🛡️', '📦', '🔬'];

interface WorkspaceProfileSectionProps {
  currentWorkspace: Workspace | null;
  detail: any;
  isOwnerOrAdmin: boolean;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editName: string;
  setEditName: (name: string) => void;
  editDescription: string;
  setEditDescription: (desc: string) => void;
  editIcon: string;
  setEditIcon: (icon: string) => void;
  handleUpdate: (e: React.FormEvent) => void;
  isUpdating: boolean;
  onOpenCropModal: (src: string, fileName: string) => void;
}

export const WorkspaceProfileSection: React.FC<WorkspaceProfileSectionProps> = ({
  currentWorkspace,
  detail,
  isOwnerOrAdmin,
  isEditing,
  setIsEditing,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editIcon,
  setEditIcon,
  handleUpdate,
  isUpdating,
  onOpenCropModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleIconFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <WorkspaceSymbol iconVal={detail?.icon || currentWorkspace?.icon} size={44} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                {detail?.name || currentWorkspace?.name || '워크스페이스'}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--secondary)',
                  background: 'rgba(78, 201, 176, 0.1)',
                  border: '1px solid var(--secondary)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                내 권한: {currentWorkspace?.myRole || 'MEMBER'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginTop: '2px' }}>
              식별 슬러그: <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{detail?.slug || currentWorkspace?.slug || ''}</span>
              {detail?.dbType && <span style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>DB: {detail.dbType} (완전 물리 격리)</span>}
            </div>
          </div>
        </div>

        {isOwnerOrAdmin && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            <Edit2 size={12} />
            <span>정보 수정</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '6px' }}>
              워크스페이스 심볼 (PNG 크롭 또는 이모지)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div style={{ position: 'relative' }}>
                <WorkspaceSymbol iconVal={editIcon} size={44} />
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleIconFileSelect}
                  accept="image/png, image/jpeg, image/webp, image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Camera size={13} />
                  <span>PNG 심볼 업로드 (크롭)</span>
                </button>

                {editIcon && (editIcon.startsWith('data:') || editIcon.startsWith('http')) && (
                  <button
                    type="button"
                    onClick={() => setEditIcon('🏢')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '4px 8px', color: 'var(--accent-rose)' }}
                  >
                    <Trash2 size={12} />
                    <span>심볼 초기화</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DEFAULT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setEditIcon(emoji)}
                  style={{
                    width: '30px',
                    height: '30px',
                    fontSize: '0.95rem',
                    background: editIcon === emoji ? 'var(--primary-subtle)' : 'var(--bg-dark)',
                    border: editIcon === emoji ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
              워크스페이스 이름
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-bright)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
              설명
            </label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-bright)',
                fontSize: '0.8rem',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="btn btn-primary"
              style={{ fontSize: '0.75rem' }}
            >
              {isUpdating ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
          {detail?.description || '등록된 워크스페이스 설명이 없습니다.'}
        </div>
      )}
    </div>
  );
};
