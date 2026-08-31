import React from 'react';
import type { IssueStatus } from '@/types';
import { getStatusMeta, STATUS_LIST } from '@/utils/statusUtils';

export interface StatusBadgeProps {
  status?: IssueStatus | { id?: number; name?: string; category?: string } | string | number | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
}) => {
  const meta = getStatusMeta(status);
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

export interface StatusSelectProps {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  className = 'input-field',
  disabled = false,
  style,
}) => {
  const currentMeta = getStatusMeta(value);

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
      {STATUS_LIST.map((s) => (
        <option key={s.id} value={s.id}>
          {s.fullLabel}
        </option>
      ))}
    </select>
  );
};
