import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ChevronDown, UserPlus, Settings, Check } from 'lucide-react';
import { WorkspaceInviteModal } from './WorkspaceInviteModal';

export const renderWorkspaceIcon = (icon?: string | null, size = 15) => {
  if (icon && (icon.startsWith('data:image/') || icon.startsWith('http'))) {
    return (
      <img
        src={icon}
        alt="Workspace Symbol"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '3px',
          objectFit: 'cover',
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      />
    );
  }
  return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{icon || '🏢'}</span>;
};

export const WorkspaceDropdown: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoToSettings = () => {
    setIsOpen(false);
    window.location.hash = '#/settings';
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: isOpen ? '#37373d' : 'var(--bg-input)',
          border: isOpen ? '1px solid var(--border-focus)' : '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '2px 7px',
          fontSize: '0.72rem',
          fontWeight: 500,
          color: 'var(--text-bright)',
          cursor: 'pointer',
          height: '22px',
          outline: 'none',
          transition: 'background-color 0.1s, border-color 0.1s',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = '#555555';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = 'var(--border-light)';
        }}
        title={`단일 워크스페이스: ${currentWorkspace?.name || 'AntiGravity'}`}
      >
        {renderWorkspaceIcon(currentWorkspace?.icon, 14)}
        <span
          style={{
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 600,
          }}
        >
          {currentWorkspace?.name || 'AntiGravity'}
        </span>
        <ChevronDown size={11} color="var(--text-muted)" style={{ flexShrink: 0, marginLeft: '2px' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '220px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1000,
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          {/* 워크스페이스 정보 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-card-hover)',
            }}
          >
            {renderWorkspaceIcon(currentWorkspace?.icon, 22)}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: 'var(--text-bright)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentWorkspace?.name || 'AntiGravity'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {currentWorkspace?.myRole || 'OWNER'} · 단일 워크스페이스
              </div>
            </div>
            <Check size={12} color="var(--accent-cyan)" />
          </div>

          <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />

          {/* 워크스페이스 설정 버튼 */}
          <button
            type="button"
            onClick={handleGoToSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '5px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Settings size={13} color="var(--text-sub)" />
            <span>워크스페이스 설정 (심볼/이름)</span>
          </button>

          {/* 멤버 초대 버튼 */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsInviteModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '5px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: 'var(--secondary)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <UserPlus size={13} />
            <span>멤버 초대 / 관리</span>
          </button>
        </div>
      )}

      {/* 멤버 초대 모달 */}
      <WorkspaceInviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
};
