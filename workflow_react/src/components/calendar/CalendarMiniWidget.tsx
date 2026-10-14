import React, { useState, useMemo } from 'react';
import { useIssues } from '@/api/issues';
import { Spinner } from '@/components/common';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { Issue } from '@/types';
import type { WidgetProps, Widgetable } from '@/types/widget';
import { CalendarMiniList } from './CalendarMiniList';
import { usePrefStore } from '@/stores/usePrefStore';
import { generateMonthFlatDays, getWeekdayNames } from '@/utils/calendarUtils';

export const CalendarMiniWidget: React.FC<WidgetProps> = ({
  config = {},
  onSelectIssue,
}) => {
  const isSundayStart = usePrefStore((s) => s.isSundayStart);
  const weekdays = useMemo(() => getWeekdayNames(isSundayStart), [isSundayStart]);
  const projectId = config.projectId === 'ALL' ? undefined : config.projectId;
  const { data: issues = [], isLoading } = useIssues(
    { projectId: projectId || undefined, all: true },
    { enabled: true }
  );

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDateStr(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(null);
  };

  // 날짜별 일감 매핑
  const issuesByDate = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    issues.forEach((iss) => {
      const targetDate = iss.dueDate || iss.plannedStartDate;
      if (targetDate) {
        const dStr = new Date(targetDate).toISOString().split('T')[0];
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(iss);
      }
    });
    return map;
  }, [issues]);

  // 이번 달 전체 일감 목록
  const currentMonthIssues = useMemo(() => {
    const yStr = String(currentYear);
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const prefix = `${yStr}-${mStr}`;
    return issues
      .filter((iss) => {
        const targetDate = iss.dueDate || iss.plannedStartDate;
        if (!targetDate) return false;
        const dStr = new Date(targetDate).toISOString().split('T')[0];
        return dStr.startsWith(prefix);
      })
      .sort((a, b) => {
        const dateA = a.dueDate || a.plannedStartDate || '';
        const dateB = b.dueDate || b.plannedStartDate || '';
        return dateA.localeCompare(dateB);
      });
  }, [issues, currentYear, currentMonth]);

  // 달력 날짜 그리드 계산 (공통 calendarUtils 활용)
  const calendarDays = useMemo(() => {
    return generateMonthFlatDays(currentYear, currentMonth, isSundayStart).map((c) => ({
      dayNumber: c.date,
      dateStr: c.dateStr,
      isCurrentMonth: c.monthOffset === 0,
    }));
  }, [currentYear, currentMonth, isSundayStart]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCellClick = (dateStr: string) => {
    setSelectedDateStr((prev) => (prev === dateStr ? null : dateStr));
  };

  // 하단에 상시 표시될 리스트 목록 결정
  const activeListIssues = useMemo(() => {
    if (selectedDateStr) {
      return issuesByDate[selectedDateStr] || [];
    }
    return currentMonthIssues;
  }, [selectedDateStr, issuesByDate, currentMonthIssues]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px' }}>
        <Spinner centered label="일정을 불러오는 중..." />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '220px',
        overflow: 'hidden',
      }}
    >
      {/* Month Navigation Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          padding: '2px 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)' }}>
            {currentYear}년 {currentMonth + 1}월
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleToday}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.68rem',
              padding: '2px 6px',
              color: 'var(--text-sub)',
              cursor: 'pointer',
            }}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontSize: '0.66rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-divider)',
        }}
      >
        {weekdays.map((wd, idx) => {
          const isSun = isSundayStart ? idx === 0 : idx === 6;
          const isSat = isSundayStart ? idx === 6 : idx === 5;
          return (
            <div key={wd} style={{ color: isSun ? '#ff6b6b' : isSat ? '#4ec9b0' : undefined }}>
              {wd}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid Cells */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginTop: '4px',
          flex: 1,
        }}
      >
        {calendarDays.map((cell) => {
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDateStr;
          const cellIssues = issuesByDate[cell.dateStr] || [];
          const hasIssues = cellIssues.length > 0;

          return (
            <div
              key={cell.dateStr}
              onClick={() => handleCellClick(cell.dateStr)}
              style={{
                minHeight: '28px',
                padding: '2px',
                borderRadius: '3px',
                background: isSelected
                  ? 'rgba(0, 122, 204, 0.25)'
                  : isToday
                  ? 'rgba(0, 122, 204, 0.1)'
                  : 'transparent',
                border: isSelected
                  ? '1px solid var(--primary)'
                  : isToday
                  ? '1px solid rgba(0, 122, 204, 0.4)'
                  : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                transition: 'all 0.1s ease',
              }}
            >
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: isToday || isSelected ? 700 : 400,
                  color: !cell.isCurrentMonth
                    ? 'var(--text-placeholder)'
                    : isToday
                    ? 'var(--primary)'
                    : 'var(--text-main)',
                }}
              >
                {cell.dayNumber}
              </span>

              {hasIssues && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginTop: '1px' }}>
                  <span
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                    }}
                  />
                  {cellIssues.length > 1 && (
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-sub)', lineHeight: 1 }}>
                      {cellIssues.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Permanent Scrollable List */}
      <CalendarMiniList
        selectedDateStr={selectedDateStr}
        onClearSelectedDate={() => setSelectedDateStr(null)}
        activeListIssues={activeListIssues}
        currentMonth={currentMonth}
        onSelectIssue={onSelectIssue}
      />
    </div>
  );
};

export const calendarWidgetDefinition: Widgetable = {
  type: 'calendar',
  title: '캘린더 일정',
  description: '월간 캘린더 그리드 상에서 일자별 마감 일감을 확인하고 날짜를 클릭하여 상세를 탐색합니다.',
  defaultColSpan: 6,
  defaultHeight: 'normal',
  icon: <CalendarIcon size={22} color="#cca700" />,
  badge: '월간 일정',
  Component: CalendarMiniWidget,
};
