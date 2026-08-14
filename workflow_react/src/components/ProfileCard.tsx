import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, LogOut, LogIn, Mail, Settings } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface ProfileCardProps {
  onOpenAuth?: () => void;
  onOpenSettings?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ onOpenAuth, onOpenSettings }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);


  return (
    <div
      style={{
        background: '#252526',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        userSelect: 'none',
      }}
    >
      {!isAuthenticated || !user ? (
        /* ================= GUEST / NOT LOGGED IN STATE ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: 'var(--radius-xs)',
                background: '#3c3c3c',
                color: 'var(--text-sub)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserIcon size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                게스트 사용자
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                로그인이 필요합니다
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenAuth}
            style={{
              width: '100%',
              height: '26px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <LogIn size={12} /> 로그인 / 회원가입
          </button>
        </div>
      ) : (
        /* ================= AUTHENTICATED / LOGGED IN STATE ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Top Row: User Avatar & Name only (No '(나)' badge, no inline logout text) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.82rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-bright)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={user.name || user.email}
              >
                {user.name || user.email}
              </span>
            </div>
          </div>

          {/* Middle Row: Full Email text (No box border/background, muted grey color) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '5px',
              fontSize: '0.72rem',
              padding: '2px 0',
              lineHeight: 1.35,
            }}
          >
            <Mail size={12} color="#858585" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span
              style={{
                color: '#969696',
                wordBreak: 'break-all',
                fontSize: '0.72rem',
              }}
            >
              {user.email}
            </span>
          </div>

          {/* Bottom Row: Settings & Logout icon buttons positioned below the email */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px',
              paddingTop: '6px',
              borderTop: '1px solid #333333',
              marginTop: '2px',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenSettings}
              style={{
                padding: '2px 6px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#2d2d2d',
                border: '1px solid #3c3c3c',
                color: 'var(--text-main)',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
              title="설정 및 프로필 편집"
            >
              <Settings size={12} />
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                padding: '2px 6px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#2d2d2d',
                border: '1px solid #3c3c3c',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                transition: 'color 0.1s ease, border-color 0.1s ease',
              }}
              title="로그아웃"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f14c4c';
                e.currentTarget.style.borderColor = 'rgba(241, 76, 76, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = '#3c3c3c';
              }}
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="로그아웃 확인"
        message="정말 로그아웃하시겠습니까?&#10;로그아웃 시 현재 세션이 종료됩니다."
        confirmText="로그아웃"
        cancelText="취소"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

