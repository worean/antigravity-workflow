import { CheckCircle2, Lock, RefreshCw } from 'lucide-react';
import { useSyncGoogleCalendar } from '@/api/calendar';
import { useUIStore } from '@/stores/useUIStore';
import type { GoogleCalendarStatus } from '@/types';

interface CalendarGoogleSyncBannerProps {
  status?: GoogleCalendarStatus | null;
  isLoading?: boolean;
}

export const CalendarGoogleSyncBanner: React.FC<CalendarGoogleSyncBannerProps> = ({
  status,
  isLoading = false,
}) => {
  const showToast = useUIStore((state) => state.showToast);
  const syncMutation = useSyncGoogleCalendar();

  const isGoogleLinked = status?.isGoogleLinked ?? false;

  const handleSync = async () => {
    if (!isGoogleLinked || syncMutation.isPending) return;

    try {
      const res = await syncMutation.mutateAsync();
      showToast(
        res.message || 'Google Calendar와 성공적으로 동기화되었습니다.',
        'success'
      );
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Google Calendar 동기화에 실패했습니다.';
      showToast(errorMsg, 'error');
    }
  };

  // 1. Google 계정 연동 유저 UI
  if (isGoogleLinked) {
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
          background: 'rgba(46, 160, 67, 0.12)',
          border: '1px solid rgba(46, 160, 67, 0.35)',
          fontSize: '0.78rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(46, 160, 67, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ec9b0',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: '#4ec9b0' }}>
                Google Calendar 연동 활성화
              </span>
              {status?.googleEmail && (
                <span style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                  ({status.googleEmail})
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', margin: '2px 0 0 0' }}>
              {status?.lastSyncedAt
                ? `마지막 동기화: ${new Date(status.lastSyncedAt).toLocaleString()}`
                : '워크스페이스 일정이 Google Calendar와 실시간 연동됩니다.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncMutation.isPending || isLoading}
          className="btn btn-emerald btn-sm"
          title="워크스페이스 일정을 Google Calendar에 지금 동기화합니다"
          style={{ height: '26px' }}
        >
          <RefreshCw
            size={13}
            className={syncMutation.isPending ? 'animate-spin' : ''}
          />
          <span>{syncMutation.isPending ? '동기화 중...' : '구글 캘린더 동기화'}</span>
        </button>
      </div>
    );
  }

  // 2. 비Google 로그인 유저 안내 배너 (잠금 상태)
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
        background: 'rgba(220, 160, 60, 0.1)',
        border: '1px solid rgba(220, 160, 60, 0.3)',
        fontSize: '0.78rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(220, 160, 60, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dcdcaa',
            flexShrink: 0,
          }}
        >
          <Lock size={15} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: '#dcdcaa' }}>
              Google Calendar 연동 비활성화
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '1px 5px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(220, 160, 60, 0.2)',
                color: '#dcdcaa',
                border: '1px solid rgba(220, 160, 60, 0.3)',
              }}
            >
              구글 로그인 전용
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', margin: '2px 0 0 0' }}>
            Google Calendar 자동 동기화는 Google 계정으로 로그인한 사용자에게만 지원됩니다.
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="btn btn-secondary btn-sm"
        style={{ opacity: 0.6, cursor: 'not-allowed', height: '26px' }}
        title="Google 로그인 계정만 구글 캘린더 연동을 이용할 수 있습니다"
      >
        <Lock size={13} />
        <span>동기화 지원 불가</span>
      </button>
    </div>
  );
};
