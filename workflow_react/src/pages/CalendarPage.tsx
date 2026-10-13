import React, { useState, useMemo, useEffect } from 'react';
import {
  useCalendarEvents,
  useCalDavStatus,
} from '@/api/calendar';
import { useProjects } from '@/api/projects';
import { useUIStore } from '@/stores/useUIStore';
import { usePrefStore } from '@/stores/usePrefStore';
import { Spinner } from '@/components/common';
import {
  CalendarHeader,
  CalendarMonthGrid,
  CalendarWeekGrid,
  GoogleEventModal,
  CalDavConnectModal,
} from '@/components/calendar';
import type { CalendarViewMode, CalendarEvent } from '@/types';

interface CalendarPageProps {
  onSelectIssue?: (issueId: number) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onSelectIssue }) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>('ALL');
  const [onlyMyEvents, setOnlyMyEvents] = useState<boolean>(false);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<CalendarEvent | null>(null);
  const [isCalDavModalOpen, setIsCalDavModalOpen] = useState<boolean>(false);

  const isSundayStart = usePrefStore((state) => state.isSundayStart);
  const openIssueModal = useUIStore((state) => state.openIssueModal);
  const openIssueDetail = useUIStore((state) => state.openIssueDetail);

  // 1. 프로젝트 목록 조회 (필터링용)
  const { data: projects = [] } = useProjects();

  // 2. 외부 CalDAV 연동 상태 조회
  const { data: caldavStatus } = useCalDavStatus();

  // 3. 현재 조회 범위 계산 (월간 / 주간에 따른 날짜 필터)
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'month') {
      const start = new Date(year, month - 1, 20).toISOString();
      const end = new Date(year, month + 2, 10).toISOString();
      return { startDate: start, endDate: end };
    } else {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = isSundayStart ? day : (day + 6) % 7;
      startOfWeek.setDate(startOfWeek.getDate() - diff - 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 8);

      return {
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
      };
    }
  }, [currentDate, viewMode, isSundayStart]);

  // 4. 캘린더 일정 데이터 조회
  const {
    data: events = [],
    isLoading: eventsLoading,
  } = useCalendarEvents({
    projectId: selectedProjectId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    onlyMyEvents,
  });

  // CalDAV 일정 및 연동 상태 브라우저 콘솔 로깅
  useEffect(() => {
    if (eventsLoading) return;
    const caldavEvents = events.filter((e) => e.type === 'caldav' || e.source === 'caldav');

    if (caldavStatus?.isConnected) {
      console.log(
        `%c[CalDAV Status]%c 연동: 성공 (서버: ${caldavStatus.domain || caldavStatus.serverUrl}, 계정: ${caldavStatus.username}), 탐색 달력: ${caldavStatus.discoveredCalendars?.length || 0}개, 화면 표시 일정: ${caldavEvents.length}건`,
        'background: #8a2be2; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;',
        'color: #a855f7; font-weight: 600;'
      );
    }
  }, [events, caldavStatus, eventsLoading]);

  // 4. 날짜 이동 핸들러
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (viewMode === 'month') {
        nextDate.setMonth(nextDate.getMonth() - 1);
      } else {
        nextDate.setDate(nextDate.getDate() - 7);
      }
      return nextDate;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (viewMode === 'month') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      return nextDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 5. 일정 선택 및 일자 클릭 핸들러
  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.type === 'google' || event.type === 'caldav') {
      setSelectedDetailEvent(event);
      return;
    }

    if (event.issueId) {
      if (onSelectIssue) {
        onSelectIssue(event.issueId);
      } else {
        openIssueDetail(event.issueId);
      }
    }
  };

  const handleDateClick = (_dateStr: string) => {
    const defaultProjectId =
      selectedProjectId !== 'ALL' && typeof selectedProjectId === 'number'
        ? selectedProjectId
        : null;
    openIssueModal(defaultProjectId);
  };

  return (
    <div className="calendar-view-container animate-fade-in">
      {/* 1. 캘린더 툴바 헤더 (날짜 네비게이션, 뷰 체인저, 프로젝트 필터, CalDAV 연동, 내 일정 필터, 새 일감 버튼) */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        onOpenCalDavModal={() => setIsCalDavModalOpen(true)}
        isCalDavConnected={caldavStatus?.isConnected ?? false}
        onlyMyEvents={onlyMyEvents}
        onOnlyMyEventsChange={setOnlyMyEvents}
        isSundayStart={isSundayStart}
        onNewIssue={() =>
          openIssueModal(
            selectedProjectId !== 'ALL' && typeof selectedProjectId === 'number'
              ? selectedProjectId
              : null
          )
        }
      />

      {/* 3. 캘린더 뷰 그리드 (월간 / 주간) - 이전 데이터가 있으면 로딩 중이어도 화면 유지! */}
      {(eventsLoading && events.length === 0) ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <Spinner centered label="일정을 불러오는 중입니다..." />
        </div>
      ) : viewMode === 'month' ? (
        <CalendarMonthGrid
          currentDate={currentDate}
          events={events}
          onSelectEvent={handleSelectEvent}
          onDateClick={handleDateClick}
          isSundayStart={isSundayStart}
        />
      ) : (
        <CalendarWeekGrid
          currentDate={currentDate}
          events={events}
          onSelectEvent={handleSelectEvent}
          onDateClick={handleDateClick}
          isSundayStart={isSundayStart}
        />
      )}

      {/* 4. Google & CalDAV 캘린더 전용 상세 모달 */}
      <GoogleEventModal
        event={selectedDetailEvent}
        onClose={() => setSelectedDetailEvent(null)}
      />

      {/* 5. 외부 CalDAV 캘린더 연동 모달 */}
      <CalDavConnectModal
        isOpen={isCalDavModalOpen}
        onClose={() => setIsCalDavModalOpen(false)}
      />
    </div>
  );
};
