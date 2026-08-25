import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-xs)',
  style,
  className = '',
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        display: 'inline-block',
        ...style,
      }}
    />
  );
};

export const SkeletonCard: React.FC<{ height?: number; count?: number }> = ({ height = 70, count = 1 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            padding: '10px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minHeight: `${height}px`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="50px" height={18} borderRadius={10} />
          </div>
          <Skeleton width="85%" height={12} />
          <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
            <Skeleton width="60px" height={16} />
            <Skeleton width="60px" height={16} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonDashboard: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="animate-fade-in">
      {/* Top Toolbar Skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
        }}
      >
        <Skeleton width="180px" height={16} />
        <div style={{ display: 'flex', gap: '6px' }}>
          <Skeleton width="70px" height={24} />
          <Skeleton width="90px" height={24} />
        </div>
      </div>

      {/* Stats Summary Bar Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Skeleton width={28} height={28} borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <Skeleton width="40px" height={10} />
              <Skeleton width="30px" height={16} />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Main Section Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '10px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Skeleton width="120px" height={14} style={{ marginBottom: '4px' }} />
          <SkeletonCard count={3} height={60} />
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Skeleton width="120px" height={14} style={{ marginBottom: '4px' }} />
          <SkeletonCard count={3} height={60} />
        </div>
      </div>
    </div>
  );
};

