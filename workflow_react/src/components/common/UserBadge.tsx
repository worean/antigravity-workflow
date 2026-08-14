import React from 'react';
import { User as UserIcon } from 'lucide-react';
import type { User } from '../../types';

interface UserBadgeProps {
  user?: User | null;
  currentUserId?: number | null;
  fallbackText?: string;
  size?: 'sm' | 'md';
}

export const UserBadge: React.FC<UserBadgeProps> = ({
  user,
  currentUserId,
  fallbackText = '미지정',
  size = 'sm',
}) => {
  if (!user) {
    return (
      <span style={{ fontSize: size === 'sm' ? '0.7rem' : '0.75rem', color: 'var(--text-muted)' }}>
        {fallbackText}
      </span>
    );
  }

  const isMe = Boolean(currentUserId && user.id === currentUserId);
  const displayName = user.name || user.email;

  const sizeStyles = {
    sm: { fontSize: '0.72rem', iconSize: 11, padding: '1px 5px' },
    md: { fontSize: '0.76rem', iconSize: 12, padding: '2px 6px' },
  }[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: sizeStyles.fontSize,
        fontWeight: isMe ? 600 : 400,
        color: isMe ? '#9cdcfe' : 'var(--text-main)',
        background: isMe ? 'rgba(0, 122, 204, 0.15)' : '#2d2d2d',
        border: isMe ? '1px solid rgba(0, 122, 204, 0.35)' : '1px solid #3c3c3c',
        padding: sizeStyles.padding,
        borderRadius: 'var(--radius-xs)',
        userSelect: 'none',
      }}
    >
      <UserIcon size={sizeStyles.iconSize} color={isMe ? '#9cdcfe' : 'var(--text-sub)'} />
      {displayName}
      {isMe && (
        <span style={{ fontSize: '0.65rem', fontWeight: 700, marginLeft: '2px', color: '#9cdcfe' }}>
          (나)
        </span>
      )}
    </span>
  );
};
