import React, { useMemo, useState } from 'react';
import { useCalendarEvents } from '@/api/calendar';
import { Spinner } from '@/components/common';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { CalendarEvent } from '@/types';
import type { WidgetProps, Widgetable } from '@/types/widget';
import { CalendarDayPopup, getCalendarEventColor, type CalendarPopupAnchor } from './CalendarDayPopup';
import { usePrefStore } from '@/stores/usePrefStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { generateMonthFlatDays, getWeekdayNames, sortCalendarEvents } from '@/utils/calendarUtils';
import { addDays, formatDateOnly, getEffectiveEventRange, parseLocalDate } from '@/utils/dateUtils';

const MAX_TOOLTIP_ITEMS = 5;

export const CalendarMiniWidget: React.FC<WidgetProps> = ({ config = {} }) => {
  const isSundayStart = usePrefStore((s) => s.isSundayStart);
  const weekdays = useMemo(() => getWeekdayNames(isSundayStart), [isSundayStart]);
  const projectId = config.projectId === 'ALL' ? undefined : config.projectId;

  const miniCurrentDateStr = useCalendarStore((s) => s.miniCurrentDateStr);
  const navigateMiniMonth = useCalendarStore((s) => s.navigateMiniMonth);
  const goToMiniToday = useCalendarStore((s) => s.goToMiniToday);

  // 클릭한 날짜/좌표의 상세 팝오버 (위젯 로컬 상태)
  const [popupAnchor, setPopupAnchor] = useState<CalendarPopupAnchor | null>(null);
  const popupDateStr = popupAnchor?.dateStr ?? null;

  const currentDate = useMemo(() => {
    const d = new Date(miniCurrentDateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [miniCurrentDateStr]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    navigateMiniMonth('prev');
  };

  const handleNextMonth = () => {
    navigateMiniMonth('next');
  };

  const handleToday = () => {
    goToMiniToday();
  };

  // 달력 날짜 그리드 계산 (공통 calendarUtils 활용)
  const calendarDays = useMemo(() => {
    return generateMonthFlatDays(currentYear, currentMonth, isSundayStart).map((c) => ({
      dayNumber: c.date,
      dateStr: c.dateStr,
      isCurrentMonth: c.monthOffset === 0,
      isHoliday: c.isHoliday,
      holidayName: c.holidayName,
      dayOfWeek: c.dayOfWeek,
    }));
  }, [currentYear, currentMonth, isSundayStart]);

  // 캘린더 일정 화면과 동일한 이벤트 소스(이슈 + CalDAV 등, 연동 설정 반영)를 표시 범위만큼 조회
  const { data: events = [], isLoading } = useCalendarEvents({
    projectId: projectId || 'ALL',
    startDate: `${calendarDays[0].dateStr}T00:00:00`,
    endDate: `${calendarDays[calendarDays.length - 1].dateStr}T23:59:59`,
  });

  // 날짜별 일정 매핑 (다일 일정은 걸친 모든 날짜에 포함)
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((evt) => {
      const { startDateOnly, endDateOnly } = getEffectiveEventRange(evt.startDate, evt.endDate);
      const start = parseLocalDate(startDateOnly);
      const end = parseLocalDate(endDateOnly);
      if (!start || !end) return;
      for (let d = start, guard = 0; d <= end && guard < 62; d = addDays(d, 1), guard++) {
        const key = formatDateOnly(d);
        (map[key] ||= []).push(evt);
      }
    });
    // 정렬 우선순위: 이슈 최상단 > 종일 일정(기간 긴 순) > 시간제 일정(시작 시간 빠른 순)
    Object.keys(map).forEach((k) => {
      map[k] = sortCalendarEvents(map[k]);
    });
    return map;
  }, [events]);

  const todayStr = formatDateOnly(new Date());

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
          const isSelected = cell.dateStr === popupDateStr;
          const cellEvents = eventsByDate[cell.dateStr] || [];
          const hasEvents = cellEvents.length > 0;

          // Tooltip: 공휴일 + 일정 제목 요약
          const tooltipLines = [cell.holidayName ? `${cell.dateStr} (${cell.holidayName})` : cell.dateStr];
          cellEvents.slice(0, MAX_TOOLTIP_ITEMS).forEach((e) => tooltipLines.push(`• ${e.title}`));
          if (cellEvents.length > MAX_TOOLTIP_ITEMS) {
            tooltipLines.push(`… 외 ${cellEvents.length - MAX_TOOLTIP_ITEMS}건`);
          }

          return (
            <div
              key={cell.dateStr}
              onClick={(e) => setPopupAnchor({ dateStr: cell.dateStr, x: e.clientX, y: e.clientY })}
              title={tooltipLines.join('\n')}
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
                    : cell.isHoliday
                    ? '#ff6b6b'
                    : cell.dayOfWeek === 6
                    ? '#4ec9b0'
                    : 'var(--text-main)',
                }}
              >
                {cell.dayNumber}
              </span>

              {hasEvents && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginTop: '1px' }}>
                  {cellEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: getCalendarEventColor(e),
                      }}
                    />
                  ))}
                  {cellEvents.length > 3 && (
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-sub)', lineHeight: 1 }}>
                      {cellEvents.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 날짜 클릭 위치에 표시되는 비모달 팝오버 */}
      <CalendarDayPopup
        anchor={popupAnchor}
        events={popupDateStr ? eventsByDate[popupDateStr] || [] : []}
        onClose={() => setPopupAnchor(null)}
      />
    </div>
  );
};

export const calendarWidgetDefinition: Widgetable = {
  type: 'calendar',
  title: '캘린더 일정',
  description: '월간 캘린더 그리드 상에서 일자별 일정(이슈·CalDAV 등)을 확인하고 날짜를 클릭하면 간단한 팝업으로 세부 일정을 봅니다.',
  defaultColSpan: 6,
  defaultHeight: 'normal',
  icon: <CalendarIcon size={22} color="#cca700" />,
  badge: '월간 일정',
  Component: CalendarMiniWidget,
};
