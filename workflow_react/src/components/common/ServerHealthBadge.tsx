import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Database } from 'lucide-react';
import { getSystemHealth, systemKeys } from '@/api/system';

export const ServerHealthBadge: React.FC = () => {
  const [showPopover, setShowPopover] = useState(false);

  const { data: health, isLoading, isError } = useQuery({
    queryKey: systemKeys.health(),
    queryFn: getSystemHealth,
    refetchInterval: 30000,
  });

  const getStatusColor = () => {
    if (isLoading) return 'var(--text-muted)';
    if (isError || health?.status === 'DOWN') return 'var(--accent-rose)';
    if (health?.status === 'DEGRADED') return 'var(--accent-amber)';
    return 'var(--secondary)';
  };

  const getStatusText = () => {
    if (isLoading) return '서버 확인 중...';
    if (isError || health?.status === 'DOWN') return '서버 오프라인';
    if (health?.status === 'DEGRADED') return '서비스 저하';
    return '서버 정상';
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0초';
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}시간 ${mins % 60}분`;
    if (mins > 0) return `${mins}분 ${seconds % 60}초`;
    return `${seconds}초`;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '0.72rem',
          color: 'var(--text-main)',
          transition: 'all 0.15s ease',
        }}
        title="시스템 진단 정보 보기"
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            display: 'inline-block',
          }}
        />
        <Activity size={12} color={getStatusColor()} />
        <span style={{ fontWeight: 600 }}>{getStatusText()}</span>
      </button>

      {showPopover && health && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '240px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            boxShadow: 'var(--shadow-lg)',
            padding: '10px 12px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.72rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '6px',
              fontWeight: 600,
              color: 'var(--text-bright)',
            }}
          >
            <span>시스템 진단 상태</span>
            <span style={{ color: getStatusColor() }}>{health.status}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-sub)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>서버 가동 시간:</span>
              <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>
                {formatUptime(health.uptimeSeconds)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>힙 메모리 사용량:</span>
              <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>
                {health.memoryUsageMb} MB
              </span>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border-light)',
              paddingTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={11} color="var(--primary)" />
                <span>글로벌 DB:</span>
              </span>
              <span style={{ color: health.database.globalDb.status === 'CONNECTED' ? 'var(--secondary)' : 'var(--accent-rose)' }}>
                {health.database.globalDb.status === 'CONNECTED' ? '정상 연결' : '오류'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={11} color="var(--accent-cyan)" />
                <span>테넌트 DB:</span>
              </span>
              <span style={{ color: health.database.workspaceDb.status === 'CONNECTED' ? 'var(--secondary)' : 'var(--accent-rose)' }}>
                {health.database.workspaceDb.status === 'CONNECTED' ? '정상 연결' : '오류'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
