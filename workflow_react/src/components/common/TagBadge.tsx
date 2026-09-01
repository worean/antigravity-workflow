import React from 'react';
import { Hash } from 'lucide-react';
import type { Tag } from '@/types';

interface TagBadgeProps {
  tag: Tag | string;
  size?: 'xs' | 'sm' | 'md';
  onClick?: (tagName: string) => void;
  onRemove?: (tagName: string) => void;
  clickable?: boolean;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  tag,
  size = 'sm',
  onClick,
  onRemove,
  clickable = !!onClick,
}) => {
  const tagName = typeof tag === 'string' ? tag.replace(/^#/, '') : tag.name;
  const tagColor = typeof tag === 'object' && tag.color ? tag.color : '#3b82f6';

  const sizeStyles = {
    xs: { fontSize: '0.65rem', padding: '1px 5px', iconSize: 10 },
    sm: { fontSize: '0.72rem', padding: '2px 7px', iconSize: 11 },
    md: { fontSize: '0.8rem', padding: '3px 9px', iconSize: 13 },
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    if (clickable && onClick) {
      e.stopPropagation();
      onClick(tagName);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    if (onRemove) {
      e.stopPropagation();
      onRemove(tagName);
    }
  };

  return (
    <span
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        background: `rgba(59, 130, 246, 0.12)`,
        border: `1px solid rgba(59, 130, 246, 0.3)`,
        color: 'var(--text-main)',
        borderRadius: 'var(--radius-xs)',
        fontSize: sizeStyles.fontSize,
        padding: sizeStyles.padding,
        lineHeight: 1.2,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
      className={clickable ? 'tag-badge-interactive' : ''}
      title={clickable ? `클릭하여 #${tagName} 태그로 필터링` : `#${tagName}`}
    >
      <Hash size={sizeStyles.iconSize} style={{ color: tagColor, opacity: 0.9 }} />
      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{tagName}</span>
      {onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            marginLeft: '2px',
            lineHeight: 1,
            fontSize: '0.8rem',
          }}
          title="태그 삭제"
        >
          ×
        </button>
      )}
    </span>
  );
};
