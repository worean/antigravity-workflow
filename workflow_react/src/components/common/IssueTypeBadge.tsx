import React from 'react';
import type { IssueType } from '@/types';
import { getIssueTypeMeta, ISSUE_TYPE_LIST } from '@/utils/statusUtils';

export interface IssueTypeBadgeProps {
  type?: IssueType | { id?: number; name?: string; key?: string } | string | number | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const IssueTypeBadge: React.FC<IssueTypeBadgeProps> = ({
  type,
  size = 'sm',
  showIcon = true,
}) => {
  const meta = getIssueTypeMeta(type);
  const { bg, color, border, Icon, fullLabel, key } = meta;

  const sizeStyles = {
    sm: { padding: '1px 5px', fontSize: '0.68rem', iconSize: 10, gap: 3 },
    md: { padding: '2px 7px', fontSize: '0.74rem', iconSize: 11, gap: 4 },
    lg: { padding: '4px 10px', fontSize: '0.8rem', iconSize: 13, gap: 5 },
  }[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${sizeStyles.gap}px`,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        fontWeight: 500,
        borderRadius: 'var(--radius-xs)',
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
      title={fullLabel}
    >
      {showIcon && <Icon size={sizeStyles.iconSize} />}
      {key}
    </span>
  );
};

export interface IssueTypeSelectProps {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const IssueTypeSelect: React.FC<IssueTypeSelectProps> = ({
  value,
  onChange,
  className = 'input-field',
  disabled = false,
  style,
}) => {
  const currentMeta = getIssueTypeMeta(value);

  return (
    <select
      className={className}
      value={currentMeta.id}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      style={{
        background: '#252526',
        border: '1px solid #3c3c3c',
        color: 'var(--text-main)',
        fontSize: '0.78rem',
        borderRadius: 'var(--radius-xs)',
        outline: 'none',
        ...style,
      }}
    >
      {ISSUE_TYPE_LIST.map((t) => (
        <option key={t.id} value={t.id}>
          {t.fullLabel}
        </option>
      ))}
    </select>
  );
};
