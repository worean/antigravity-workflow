import React from 'react';
import { Loader2 } from 'lucide-react';

// 1. Loading Spinner Component
export interface SpinnerProps {
  size?: number;
  label?: string;
  centered?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 24, label, centered = false }) => {
  const content = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-sub)' }}>
      <Loader2 size={size} className="animate-spin" color="var(--primary)" />
      {label && <span style={{ fontSize: '0.88rem' }}>{label}</span>}
    </div>
  );

  if (centered) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', width: '100%' }}>
        {content}
      </div>
    );
  }

  return content;
};

// 2. Status Dot Indicator
export interface DotIndicatorProps {
  color?: 'green' | 'amber' | 'red' | 'blue' | 'purple' | string;
  pulsing?: boolean;
  size?: number;
  label?: string;
}

export const DotIndicator: React.FC<DotIndicatorProps> = ({
  color = 'green',
  pulsing = false,
  size = 8,
  label,
}) => {
  const colorMap: Record<string, string> = {
    green: '#10b981',
    amber: '#f59e0b',
    red: '#f43f5e',
    blue: '#3b82f6',
    purple: '#a855f7',
  };

  const actualColor = colorMap[color] || color;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: actualColor,
          boxShadow: pulsing ? `0 0 8px ${actualColor}` : 'none',
          display: 'inline-block',
        }}
      />
      {label && <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>{label}</span>}
    </span>
  );
};

// 3. Count Badge Indicator
export interface CountBadgeProps {
  count: number;
  variant?: 'primary' | 'emerald' | 'rose' | 'amber' | 'subtle';
  size?: 'sm' | 'md';
}

export const CountBadge: React.FC<CountBadgeProps> = ({ count, variant = 'subtle', size = 'sm' }) => {
  const config = {
    primary: { bg: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', border: 'rgba(99, 102, 241, 0.3)' },
    emerald: { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    rose: { bg: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' },
    amber: { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    subtle: { bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-sub)', border: 'var(--border-light)' },
  }[variant];

  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? '0.75rem' : '0.85rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        fontSize,
        fontWeight: 700,
        borderRadius: '12px',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        userSelect: 'none',
      }}
    >
      {count}
    </span>
  );
};

// 4. Progress Bar Indicator
export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#10b981',
  height = 6,
  showLabel = false,
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: `${height}px`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${normalizedProgress}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: `${height}px`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textAlign: 'right' }}>
          {normalizedProgress}%
        </span>
      )}
    </div>
  );
};
