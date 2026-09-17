import React, { useRef } from 'react';

interface RenderCountBadgeProps {
  label?: string;
}

export const RenderCountBadge: React.FC<RenderCountBadgeProps> = ({ label = '렌더 횟수' }) => {
  const countRef = useRef<number>(0);
  countRef.current += 1;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        fontSize: '0.7rem',
        fontWeight: 600,
        borderRadius: '10px',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        color: '#38bdf8',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        transition: 'all 0.2s ease',
      }}
      title="컴포넌트 리렌더링 감지 배지"
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#38bdf8',
        }}
      />
      {label}: {countRef.current}회
    </span>
  );
};
