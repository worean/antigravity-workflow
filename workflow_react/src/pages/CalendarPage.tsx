import React, { useState, useMemo } from 'react';
import { useCalendarEvents, useGoogleCalendarStatus } from '@/api/calendar';
import { useProjects } from '@/api/projects';
import { useUIStore } from '@/stores/useUIStore';
import { Spinner } from '@/components/common';
import {
  CalendarHeader,
  CalendarGoogleSyncBanner,
  CalendarMonthGrid,
  CalendarWeekGrid,
} from '@/components/calendar';
import type { CalendarViewMode, CalendarEvent } from '@/types';

interface CalendarPageProps {
  onSelectIssue?: (issueId: number) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onSelectIssue }) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>('ALL');

  const openIssueModal = useUIStore((state) => state.openIssueModal);
  const openIssueDetail = useUIStore((state) => state.openIssueDetail);

  // 1. 프로젝트 목록 조회 (필터링용)
  const { data: projects = [] } = useProjects();

  // 2. 현재 조회 범위 계산 (월간 / 주간에 따른 날짜 필터)
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
      startOfWeek.setDate(startOfWeek.getDate() - day - 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 8);

      return {
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
      };
    }
  }, [currentDate, viewMode]);

  // 3. 캘린더 일정 데이터 및 구글 연동 상태 조회
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents({
    projectId: selectedProjectId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: googleStatus, isLoading: googleStatusLoading } = useGoogleCalendarStatus();

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
      {/* 1. 구글 캘린더 연동 배너 (구글 유저 활성화 vs 일반 유저 잠금/안내 분기) */}
      <CalendarGoogleSyncBanner
        status={googleStatus}
        isLoading={googleStatusLoading}
      />

      {/* 2. 캘린더 툴바 헤더 (날짜 네비게이션, 뷰 체인저, 프로젝트 필터, 새 일감 버튼) */}
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
        onNewIssue={() =>
          openIssueModal(
            selectedProjectId !== 'ALL' && typeof selectedProjectId === 'number'
              ? selectedProjectId
              : null
          )
        }
      />

      {/* 3. 캘린더 뷰 그리드 (월간 / 주간) */}
      {eventsLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <Spinner centered label="일정을 불러오는 중입니다..." />
        </div>
      ) : viewMode === 'month' ? (
        <CalendarMonthGrid
          currentDate={currentDate}
          events={events}
          onSelectEvent={handleSelectEvent}
          onDateClick={handleDateClick}
        />
      ) : (
        <CalendarWeekGrid
          currentDate={currentDate}
          events={events}
          onSelectEvent={handleSelectEvent}
          onDateClick={handleDateClick}
        />
      )}
    </div>
  );
};
