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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-300">
                Google Calendar 연동 활성화
              </span>
              {status?.googleEmail && (
                <span className="text-gray-400">({status.googleEmail})</span>
              )}
            </div>
            <p className="text-gray-400 mt-0.5">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-emerald-100 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
          title="워크스페이스 일정을 Google Calendar에 지금 동기화합니다"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`}
          />
          <span>{syncMutation.isPending ? '동기화 중...' : '구글 캘린더 동기화'}</span>
        </button>
      </div>
    );
  }

  // 2. 비Google 로그인 유저 안내 배너 (잠금 상태)
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <span>Google Calendar 연동 비활성화</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              구글 로그인 전용
            </span>
          </div>
          <p className="text-gray-400 mt-0.5">
            Google Calendar 자동 동기화는 Google 계정으로 로그인한 사용자에게만 지원됩니다.
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-gray-400 bg-gray-800 border border-gray-700 cursor-not-allowed opacity-60 shrink-0"
        title="Google 로그인 계정만 구글 캘린더 연동을 이용할 수 있습니다"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>동기화 지원 불가</span>
      </button>
    </div>
  );
};
