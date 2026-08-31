// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToggleFavorite } from '@/api/favorites';

export interface FavoriteButtonProps {
  targetType: 'PROJECT' | 'ISSUE' | 'SPRINT' | 'CHAT_CHANNEL';
  targetId: number;
  isFavorite?: boolean;
  size?: number | 'xs' | 'sm' | 'md' | 'lg';
  onToggleSuccess?: (isFavorite: boolean) => void;
  onOpenAuth?: () => void;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  activeColor?: string;
  inactiveColor?: string;
  stopPropagation?: boolean;
}

const SIZE_MAP: Record<string, number> = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
};

/**
 * 🌟 전역 공통 즐겨찾기(Star/Favorite) 토글 버튼
 * - Optimistic UI + 서버 자동 동기화
 * - 비인증(Guest) 상태 시 로그인 모달 자동 연동
 * - 일관된 호버 애니메이션 및 스타일 지원
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  targetType,
  targetId,
  isFavorite: externalIsFavorite,
  size = 'sm',
  onToggleSuccess,
  onOpenAuth,
  className,
  style,
  title,
  activeColor = '#eab308',
  inactiveColor = '#71717a',
  stopPropagation = true,
}) => {
  const { isAuthenticated } = useAuth();
  const toggleMutation = useToggleFavorite();
  const [localIsFavorite, setLocalIsFavorite] = useState<boolean | undefined>(externalIsFavorite);

  useEffect(() => {
    setLocalIsFavorite(externalIsFavorite);
  }, [externalIsFavorite]);

  const isFavorite = localIsFavorite ?? false;
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 13;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      e.stopPropagation();
    }

    if (!isAuthenticated) {
      if (onOpenAuth) {
        onOpenAuth();
      }
      return;
    }

    const nextState = !isFavorite;
    setLocalIsFavorite(nextState);

    toggleMutation.mutate(
      { targetType, targetId },
      {
        onSuccess: (data) => {
          setLocalIsFavorite(data.isFavorite);
          if (onToggleSuccess) {
            onToggleSuccess(data.isFavorite);
          }
        },
        onError: () => {
          setLocalIsFavorite(!nextState);
        },
      }
    );
  };

  const defaultTitle = isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록';

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title || defaultTitle}
      aria-label={title || defaultTitle}
      disabled={toggleMutation.isPending}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        padding: '2px',
        margin: 0,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '3px',
        color: isFavorite ? activeColor : inactiveColor,
        transition: 'transform 0.12s ease, color 0.12s ease',
        lineHeight: 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.15)';
        if (!isFavorite) e.currentTarget.style.color = '#a1a1aa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        if (!isFavorite) e.currentTarget.style.color = inactiveColor;
      }}
    >
      <Star
        size={pixelSize}
        fill={isFavorite ? activeColor : 'none'}
        color={isFavorite ? activeColor : 'currentColor'}
        style={{
          transition: 'fill 0.15s ease, stroke 0.15s ease',
        }}
      />
    </button>
  );
};