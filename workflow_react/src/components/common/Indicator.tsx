import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// 1. Loading Spinner Component with Debounce / Delay Support
export interface SpinnerProps {
  size?: number;
  label?: string;
  centered?: boolean;
  delayMs?: number; // ⏳ 스피너 노출 지연 시간 (기본: 1000ms = 1초, 0이면 즉시)
  className?: string;
  style?: React.CSSProperties;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 20,
  label,
  centered = false,
  delayMs = 1000,
  className = '',
  style,
}) => {
  const [visible, setVisible] = useState<boolean>(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) {
      setVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!visible) return null;

  const content = (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-sub)',
        animation: 'fadeIn 0.2s ease',
        ...style,
      }}
    >
      <Loader2
        size={size}
        className="animate-spin"
        color="var(--primary)"
        style={{ animation: 'spin 0.85s linear infinite', flexShrink: 0 }}
      />
      {label && <span style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>{label}</span>}
    </div>
  );

  if (centered) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px', width: '100%', animation: 'fadeIn 0.2s ease' }}>
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
    green: 'var(--accent-emerald)',
    amber: 'var(--priority-high-text)',
    red: 'var(--accent-rose)',
    blue: 'var(--primary)',
    purple: 'var(--accent-purple)',
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
          display: 'inline-block',
          boxShadow: pulsing ? `0 0 8px ${actualColor}` : 'none',
          animation: pulsing ? 'pulse 2s infinite' : 'none',
        }}
      />
      {label && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>}
    </span>
  );
};

// 3. Count Badge
export interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'amber' | 'muted' | string;
  size?: 'sm' | 'md' | 'lg' | string;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  variant = 'secondary',
  size = 'sm',
}) => {
  const displayCount = count > max ? `${max}+` : count;

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary)', color: 'var(--text-on-primary)' },
    secondary: { background: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border-light)' },
    danger: { background: 'var(--accent-rose)', color: 'var(--text-on-primary)' },
    warning: { background: 'var(--priority-high-text)', color: 'var(--text-inverse)' },
    amber: { background: 'var(--priority-high-bg)', color: 'var(--priority-high-text)', border: '1px solid var(--priority-high-border)' },
    muted: { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-light)' },
  };

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isSmall ? '1px 5px' : '2px 8px',
        borderRadius: '10px',
        fontSize: isSmall ? '0.65rem' : '0.72rem',
        fontWeight: 600,
        lineHeight: 1.2,
        ...variantStyles[variant],
      }}
    >
      {displayCount}
    </span>
  );
};

// 4. Progress Bar
export interface ProgressBarProps {
  value: number; // 0 to 100
  height?: number;
  color?: string;
  showLabel?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  height = 4,
  color = 'var(--primary)',
  showLabel = false,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '3px' }}>
          <span>진척도</span>
          <span>{clampedValue}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          background: 'var(--bg-subtle)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedValue}%`,
            height: '100%',
            background: color,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

// 5. Online/Offline Health Status Pill
export interface HealthPillProps {
  isHealthy: boolean | null;
  lastCheck?: string;
}

export const HealthPill: React.FC<HealthPillProps> = ({ isHealthy, lastCheck }) => {
  if (isHealthy === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-sub)' }} />
        <span>확인 중...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.72rem',
        padding: '2px 8px',
        borderRadius: 'var(--radius-xs)',
        background: isHealthy ? 'var(--badge-done-bg)' : 'var(--priority-urgent-bg)',
        border: `1px solid ${isHealthy ? 'var(--badge-done-border)' : 'var(--priority-urgent-border)'}`,
        color: isHealthy ? 'var(--accent-emerald)' : 'var(--accent-rose)',
      }}
      title={lastCheck ? `마지막 확인: ${lastCheck}` : undefined}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isHealthy ? 'var(--accent-emerald)' : 'var(--accent-rose)',
        }}
      />
      <span>{isHealthy ? '정상 작동 중' : '서버 연결 불가'}</span>
    </div>
  );
};
