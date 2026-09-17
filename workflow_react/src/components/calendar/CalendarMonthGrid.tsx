import React from 'react';
import type { CalendarEvent } from '@/types';

interface CalendarMonthGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onDateClick: (dateStr: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onDateClick,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // 1. 달력 일자 매트릭스 계산
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
  const lastDateOfPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const days: { date: number; monthOffset: number; dateStr: string }[] = [];

  // 이전 달 날짜들
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = lastDateOfPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, d);
    days.push({
      date: d,
      monthOffset: -1,
      dateStr: prevMonthDate.toISOString().split('T')[0],
    });
  }

  // 이번 달 날짜들
  for (let i = 1; i <= lastDateOfMonth; i++) {
    const curDate = new Date(year, month, i);
    days.push({
      date: i,
      monthOffset: 0,
      dateStr: curDate.toISOString().split('T')[0],
    });
  }

  // 다음 달 날짜들 (총 35 또는 42셀로 맞추기)
  const remainingCells = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    days.push({
      date: i,
      monthOffset: 1,
      dateStr: nextMonthDate.toISOString().split('T')[0],
    });
  }

  // 특정 날짜에 걸치는 이벤트 필터링
  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => {
      const start = e.startDate.split('T')[0];
      const end = e.endDate.split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const getEventClass = (evt: CalendarEvent) => {
    if (evt.type === 'sprint') return 'calendar-event-sprint';
    switch (evt.priority?.toUpperCase()) {
      case 'URGENT':
      case 'CRITICAL':
        return 'calendar-event-urgent';
      case 'HIGH':
        return 'calendar-event-high';
      case 'MEDIUM':
        return 'calendar-event-medium';
      case 'LOW':
      default:
        return 'calendar-event-low';
    }
  };

  return (
    <div className="calendar-month-grid">
      {/* 1. 요일 헤더 */}
      <div className="calendar-month-weekdays">
        {WEEKDAYS.map((w, idx) => (
          <div
            key={w}
            style={{
              color:
                idx === 0
                  ? '#f14c4c'
                  : idx === 6
                  ? '#9cdcfe'
                  : 'var(--text-sub)',
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 2. 날짜 셀 그리드 */}
      <div className="calendar-month-cells">
        {days.map((d, index) => {
          const isToday = isCurrentMonth && d.monthOffset === 0 && d.date === todayDate;
          const dayEvents = getEventsForDate(d.dateStr);
          const isWeekend = index % 7 === 0 || index % 7 === 6;

          return (
            <div
              key={`${d.dateStr}-${index}`}
              onClick={() => onDateClick(d.dateStr)}
              className={`calendar-month-cell ${d.monthOffset !== 0 ? 'other-month' : ''}`}
            >
              {/* 날짜 표시 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span
                  style={
                    isToday
                      ? {
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#ffffff',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                        }
                      : {
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          color:
                            d.monthOffset !== 0
                              ? 'var(--text-muted)'
                              : isWeekend
                              ? index % 7 === 0
                                ? '#f14c4c'
                                : '#9cdcfe'
                              : 'var(--text-bright)',
                          paddingLeft: '2px',
                        }
                  }
                >
                  {d.date}
                </span>

                {dayEvents.length > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* 이벤트 칩 목록 (최대 3개) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1 }}>
                {dayEvents.slice(0, 3).map((evt) => {
                  const isDone =
                    evt.status?.toUpperCase() === 'DONE' ||
                    evt.status?.toUpperCase() === 'COMPLETED';

                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`calendar-event-chip ${getEventClass(evt)}`}
                      title={`${evt.title} (${evt.status || ''})`}
                    >
                      <span
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'currentColor',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textDecoration: isDone ? 'line-through' : 'none',
                          opacity: isDone ? 0.6 : 1,
                        }}
                      >
                        {evt.title}
                      </span>
                    </div>
                  );
                })}

                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                    +{dayEvents.length - 3}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
