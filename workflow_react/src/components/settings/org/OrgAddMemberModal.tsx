﻿import React, { useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import type { Group, User as UserType } from '@/types';

interface OrgAddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: Group | null;
  currentUser: UserType | null;
  allUsers: UserType[];
  newMemberUserId: number | '';
  setNewMemberUserId: (id: number | '') => void;
  newMemberRole: string;
  setNewMemberRole: (role: string) => void;
  newMemberTitle: string;
  setNewMemberTitle: (title: string) => void;
  isPending: boolean;
  onAddMember: (e: React.FormEvent) => void;
}

export const OrgAddMemberModal: React.FC<OrgAddMemberModalProps> = ({
  isOpen,
  onClose,
  selectedGroup,
  currentUser,
  allUsers,
  newMemberUserId,
  setNewMemberUserId,
  newMemberRole,
  setNewMemberRole,
  newMemberTitle,
  setNewMemberTitle,
  isPending,
  onAddMember,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '440px',
          width: '92%',
          padding: '16px 20px',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          margin: 'auto',
          borderRadius: '6px',
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '8px',
          }}
        >
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              margin: 0,
              color: 'var(--text-bright)',
            }}
          >
            <UserPlus size={16} color="var(--primary)" />
            <span>'{selectedGroup?.name}' 멤버 배정</span>
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
              배정할 사용자 <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <select
              className="input-field"
              value={newMemberUserId}
              onChange={(e) => setNewMemberUserId(e.target.value ? Number(e.target.value) : '')}
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
              그룹(조직) 내 권한 <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <select
              className="input-field"
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
            >
              {(() => {
                const isCurGroupOwner =
                  currentUser?.role === 'ADMIN' ||
                  selectedGroup?.members?.some((m) => m.userId === currentUser?.id && m.role?.toUpperCase() === 'OWNER');
                return (
                  <>
                    {isCurGroupOwner && (
                      <option value="OWNER">👑 1. 오너 (Owner - 기존 오너 자동 승계)</option>
                    )}
                    <option value="ADMIN">⭐ 2. 관리자 (PM - 여러명 가능)</option>
                    <option value="MEMBER">💻 3. 담당자 (개발자)</option>
                    <option value="VIEWER">👁️ 4. 참석자 (리뷰어)</option>
                  </>
                );
              })()}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
              직책 (Title)
            </label>
            <input
              type="text"
              className="input-field"
              value={newMemberTitle}
              onChange={(e) => setNewMemberTitle(e.target.value)}
              placeholder="예: 수석연구원, 테크리드, 개발자"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isPending}
              style={{ flex: 1 }}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
              style={{ flex: 1 }}
            >
              {isPending ? '배정 중...' : '배정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
