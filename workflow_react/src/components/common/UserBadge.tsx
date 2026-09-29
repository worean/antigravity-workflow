import React from 'react';
import type { User } from '@/types';
import { Avatar } from './Avatar';

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
    sm: { fontSize: '0.72rem', avatarSize: 16, padding: '1px 6px 1px 3px' },
    md: { fontSize: '0.76rem', avatarSize: 18, padding: '2px 7px 2px 4px' },
  }[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: sizeStyles.fontSize,
        fontWeight: isMe ? 600 : 400,
        color: isMe ? 'var(--primary)' : 'var(--text-main)',
        background: isMe ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
        border: isMe ? '1px solid var(--border-focus)' : '1px solid var(--border-light)',
        padding: sizeStyles.padding,
        borderRadius: 'var(--radius-xs)',
        userSelect: 'none',
      }}
    >
      <Avatar user={user} size={sizeStyles.avatarSize} shape="rounded" showBorder={false} />
      <span>{displayName}</span>
      {isMe && (
        <span style={{ fontSize: '0.65rem', fontWeight: 700, marginLeft: '1px', color: 'var(--primary)' }}>
          (나)
        </span>
      )}
    </span>
  );
};

