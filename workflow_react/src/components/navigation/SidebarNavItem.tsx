import React from 'react';
import { ChevronDown, ChevronRight, Star, type LucideIcon } from 'lucide-react';

export interface SidebarSubitem {
  id: number;
  label: string;
  icon: string;
  onClick: () => void;
}

export interface SidebarNavItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  unreadCount?: number;
  hasMention?: boolean;
  subitems?: SidebarSubitem[];
  isSubmenuOpen: boolean;
  onToggleSubmenu: (e: React.MouseEvent) => void;
  onSelect: () => void;
  isSubitemActive: (subId: number) => boolean;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  label,
  icon: Icon,
  isActive,
  unreadCount,
  hasMention,
  subitems = [],
  isSubmenuOpen,
  onToggleSubmenu,
  onSelect,
  isSubitemActive,
}) => {
  const hasSubitems = subitems.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        type="button"
        onClick={onSelect}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '6px 8px',
          minHeight: '30px',
          borderRadius: 'var(--radius-xs)',
          border: 'none',
          background: isActive ? '#37373d' : 'transparent',
          color: isActive ? '#ffffff' : 'var(--text-main)',
          fontWeight: isActive ? 600 : 400,
          fontSize: '0.8rem',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.08s ease',
          borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = '#2a2d2e';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
          <Icon size={14} color={isActive ? 'var(--accent-cyan)' : 'var(--text-sub)'} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {Boolean(unreadCount && unreadCount > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {hasMention && (
                <span
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    padding: '0 3px',
                    borderRadius: '4px',
                    height: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  @
                </span>
              )}
              <span
                style={{
                  background: '#f43f5e',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  minWidth: '16px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount! > 99 ? '99+' : unreadCount}
              </span>
            </div>
          )}

          {hasSubitems && (
            <div
              role="button"
              onClick={onToggleSubmenu}
              title={isSubmenuOpen ? '즐겨찾기 하위 항목 접기' : '즐겨찾기 하위 항목 펼치기'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '2px',
                color: '#949ba4',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#949ba4')}
            >
              {isSubmenuOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </div>
          )}
        </div>
      </button>

      {/* 하위 즐겨찾기 목록 */}
      {hasSubitems && isSubmenuOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            marginLeft: '14px',
            paddingLeft: '6px',
            borderLeft: '2px solid rgba(255,255,255,0.08)',
            marginTop: '2px',
            marginBottom: '2px',
          }}
        >
          {subitems.map((sub) => {
            const isSubActive = isSubitemActive(sub.id);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={sub.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 8px',
                  minHeight: '26px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: isSubActive ? 'rgba(0, 122, 204, 0.22)' : 'transparent',
                  color: isSubActive ? 'var(--accent-cyan)' : '#9ca3af',
                  fontWeight: isSubActive ? 600 : 400,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.08s ease, color 0.08s ease',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isSubActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
                title={sub.label}
              >
                <span style={{ fontSize: '0.8rem', flexShrink: 0 }}>{sub.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {sub.label}
                </span>
                <Star size={10} fill="#eab308" color="#eab308" style={{ flexShrink: 0, opacity: 0.9 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
