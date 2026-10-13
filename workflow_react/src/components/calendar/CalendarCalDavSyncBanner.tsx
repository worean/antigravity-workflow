import React from 'react';
import { RefreshCw, Settings, CheckCircle2 } from 'lucide-react';
import type { CaldavStatusResponse } from '@/types';

interface CalendarCalDavSyncBannerProps {
  status?: CaldavStatusResponse | null;
  caldavEventCount?: number;
  onOpenModal: () => void;
  onRefetchEvents?: () => void;
  isRefetching?: boolean;
}

export const CalendarCalDavSyncBanner: React.FC<CalendarCalDavSyncBannerProps> = ({
  status,
  caldavEventCount = 0,
  onOpenModal,
  onRefetchEvents,
  isRefetching = false,
}) => {
  if (!status?.isConnected) {
    return null;
  }

  const calendars = status.discoveredCalendars || [];
  const displayHost = status.domain || status.serverUrl?.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') || 'CalDAV 서버';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(138, 43, 226, 0.12)',
        border: '1px solid rgba(138, 43, 226, 0.35)',
        fontSize: '0.78rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(138, 43, 226, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#b366ff',
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={16} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#d8b4fe' }}>
              CalDAV 외부 캘린더 연동 활성화
            </span>
            <span style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>
              {displayHost} ({status.username})
            </span>
            {caldavEventCount > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: 'rgba(138, 43, 226, 0.3)',
                  color: '#e9d5ff',
                  fontWeight: 600,
                  border: '1px solid rgba(138, 43, 226, 0.5)',
                }}
              >
                달력 반영: {caldavEventCount}건
              </span>
            )}
          </div>
          {calendars.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>수집된 캘린더 ({calendars.length}개):</span>
              {calendars.slice(0, 5).map((name, i) => {
                const calColor = status.calendarColors?.[name] || '#8a2be2';
                const isEnabled = status.calendarEnabled ? status.calendarEnabled[name] !== false : true;
                return (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: isEnabled ? `${calColor}22` : 'rgba(255, 255, 255, 0.05)',
                      color: isEnabled ? calColor : 'var(--text-muted)',
                      border: isEnabled ? `1px solid ${calColor}55` : '1px solid var(--border-light)',
                      borderLeft: isEnabled ? `3px solid ${calColor}` : '3px solid var(--text-muted)',
                      textDecoration: isEnabled ? 'none' : 'line-through',
                      opacity: isEnabled ? 1 : 0.6,
                      fontWeight: 500,
                    }}
                    title={isEnabled ? `${name} (표시 ON)` : `${name} (숨김 OFF)`}
                  >
                    {name}
                  </span>
                );
              })}
              {calendars.length > 5 && (
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  외 {calendars.length - 5}개
                </span>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', margin: '2px 0 0 0' }}>
              {status.lastSyncedAt
                ? `마지막 동기화: ${new Date(status.lastSyncedAt).toLocaleString()}`
                : '사내 CalDAV 서버와 실시간으로 일정을 동기화 중입니다.'}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {onRefetchEvents && (
          <button
            type="button"
            onClick={onRefetchEvents}
            disabled={isRefetching}
            className="btn btn-secondary btn-sm"
            style={{
              height: '26px',
              fontSize: '0.74rem',
              gap: '4px',
              borderColor: 'rgba(138, 43, 226, 0.4)',
              color: '#d8b4fe',
            }}
            title="외부 CalDAV 서버에서 최신 일정을 다시 가져옵니다"
          >
            <RefreshCw size={13} className={isRefetching ? 'animate-spin' : ''} />
            <span>{isRefetching ? '동기화 중...' : 'CalDAV 새로고침'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenModal}
          className="btn btn-secondary btn-sm"
          style={{ height: '26px', fontSize: '0.74rem', gap: '4px' }}
          title="CalDAV 계정 설정 및 연동 해제"
        >
          <Settings size={13} />
          <span>계정 관리</span>
        </button>
      </div>
    </div>
  );
};
