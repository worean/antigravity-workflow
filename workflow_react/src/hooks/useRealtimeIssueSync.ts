import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { issueKeys } from '@/api/issues';
import { calendarKeys } from '@/api/calendar';
import { getSocket } from '@/lib/socketClient';
import { sendDesktopNotification } from '@/utils/notificationUtils';
import type { Issue } from '@/types';

/**
 * 실시간 이슈 생성/수정/삭제/캘린더 동기화 이벤트를 구독하고,
 * 타인의 변경 시 데스크톱 알림을 발송합니다. (App.tsx 에서 분리)
 */
export function useRealtimeIssueSync(userId: number | undefined, bumpRefreshKey: () => void): void {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRealtimeIssueCreated = (data: { actorId?: number; issue: Issue }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      bumpRefreshKey();

      if (data && data.actorId && data.actorId !== userId && data.issue) {
        sendDesktopNotification({
          title: '신규 이슈 등록',
          body: `#${data.issue.issueNumber || data.issue.id} ${data.issue.title}`,
          priority: data.issue.priorityId || 2,
        });
      }
    };

    const handleRealtimeIssueUpdated = (data: { actorId?: number; issue: Issue }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      if (data?.issue?.id) {
        queryClient.invalidateQueries({ queryKey: issueKeys.detail(data.issue.id) });
      }
      bumpRefreshKey();

      if (data && data.actorId && data.actorId !== userId && data.issue) {
        sendDesktopNotification({
          title: '이슈 내용 갱신',
          body: `#${data.issue.issueNumber || data.issue.id} ${data.issue.title}`,
          priority: data.issue.priorityId || 2,
        });
      }
    };

    const handleRealtimeIssueDeleted = (_data: { actorId?: number; issueId: number }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      bumpRefreshKey();
    };

    const handleRealtimeBatchUpdated = () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      bumpRefreshKey();
    };

    const handleRealtimeCalendarSynced = () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    };

    socket.on('issue:created', handleRealtimeIssueCreated);
    socket.on('issue:updated', handleRealtimeIssueUpdated);
    socket.on('issue:deleted', handleRealtimeIssueDeleted);
    socket.on('issue:batch_schedules_updated', handleRealtimeBatchUpdated);
    socket.on('calendar:synced', handleRealtimeCalendarSynced);

    return () => {
      socket.off('issue:created', handleRealtimeIssueCreated);
      socket.off('issue:updated', handleRealtimeIssueUpdated);
      socket.off('issue:deleted', handleRealtimeIssueDeleted);
      socket.off('issue:batch_schedules_updated', handleRealtimeBatchUpdated);
      socket.off('calendar:synced', handleRealtimeCalendarSynced);
    };
  }, [userId]);
}

