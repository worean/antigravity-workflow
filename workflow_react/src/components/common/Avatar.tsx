// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import type { User } from '@/types';

export const AVATAR_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#a855f7', // Violet
  '#d946ef', // Fuchsia
  '#0ea5e9', // Sky
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#64748b', // Slate
];

export const getRandomAvatarColor = (): string => {
  const index = Math.floor(Math.random() * AVATAR_PALETTE.length);
  return AVATAR_PALETTE[index];
};

export const getHashColor = (str: string): string => {
  if (!str) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
};

export interface AvatarProps {
  user?: User | null;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  avatarColor?: string | null;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square' | 'rounded';
  showBorder?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

const SIZE_MAP: Record<string, { size: number; fontSize: string }> = {
  xs: { size: 18, fontSize: '0.62rem' },
  sm: { size: 24, fontSize: '0.72rem' },
  md: { size: 32, fontSize: '0.82rem' },
  lg: { size: 40, fontSize: '0.95rem' },
  xl: { size: 56, fontSize: '1.25rem' },
  '2xl': { size: 80, fontSize: '1.75rem' },
};

export const Avatar: React.FC<AvatarProps> = ({
  user,
  name,
  email,
  avatar,
  avatarColor,
  size = 'md',
  shape = 'rounded',
  showBorder = true,
  className = '',
  style = {},
  title,
}) => {
  const [imgError, setImgError] = useState<boolean>(false);

  // 대상 유저 정보 결정
  const targetAvatar = avatar ?? user?.avatar;
  const targetColor = avatarColor ?? user?.avatarColor;
  const targetName = name ?? user?.name ?? user?.email ?? email ?? 'User';
  const targetEmail = email ?? user?.email ?? '';

  // 크기 및 폰트 계산
  let pixelSize = 32;
  let fontSize = '0.82rem';

  if (typeof size === 'number') {
    pixelSize = size;
    fontSize = `${Math.max(10, Math.round(size * 0.4))}px`;
  } else if (SIZE_MAP[size]) {
    pixelSize = SIZE_MAP[size].size;
    fontSize = SIZE_MAP[size].fontSize;
  }

  // 모양 계산
  const borderRadius =
    shape === 'circle' ? '50%' : shape === 'rounded' ? 'var(--radius-xs)' : '0px';

  // 이니셜 계산 (한글/영문 첫 글자)
  const initial = (targetName || targetEmail || 'U').trim().charAt(0).toUpperCase() || 'U';

  // 배경 색상 계산
  const bgColor = targetColor || getHashColor(targetEmail || targetName);

  const displayTitle = title || targetName;

  // 이미지가 정상적으로 등록되어 있고 에러가 발생하지 않은 경우
  if (targetAvatar && !imgError) {
    return (
      <div
        className={className}
        title={displayTitle}
        style={{
          width: `${pixelSize}px`,
          height: `${pixelSize}px`,
          borderRadius,
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: showBorder ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
          backgroundColor: '#2d2d2d',
          flexShrink: 0,
          userSelect: 'none',
          ...style,
        }}
      >
        <img
          src={targetAvatar}
          alt={displayTitle}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // 기본 이니셜 아바타 모드 (랜덤/설정된 배경색)
  return (
    <div
      className={className}
      title={displayTitle}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        borderRadius,
        backgroundColor: bgColor,
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        border: showBorder ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        flexShrink: 0,
        userSelect: 'none',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
        transition: 'background-color 0.2s ease',
        ...style,
      }}
    >
      {initial}
    </div>
  );
};
