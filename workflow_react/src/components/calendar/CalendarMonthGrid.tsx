import React, { useMemo } from 'react';
import type { CalendarEvent } from '@/types';

interface CalendarMonthGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onDateClick: (dateStr: string) => void;
}

interface DayInfo {
  date: number;
  monthOffset: number;
  dateStr: string;
  isToday: boolean;
  isWeekend: boolean;
  dayOfWeek: number; // 0 (일) ~ 6 (토)
}

interface EventSegment {
  event: CalendarEvent;
  startCol: number; // 1 ~ 7
  endCol: number;   // 1 ~ 7
  isStart: boolean; // 시작일이 이번 주에 속하는지
  isEnd: boolean;   // 종료일이 이번 주에 속하는지
  isMultiDay: boolean; // 2일 이상의 다일 일정인지
  trackIndex: number; // 수직 위치 슬롯 (0, 1, 2...)
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

  // 1. 달력 일자 매트릭스 계산 (주 단위 7일 청크로 분할)
  const weeks = useMemo<DayInfo[][]>(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDateOfPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    const allDays: DayInfo[] = [];

    // 이전 달 날짜들
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = lastDateOfPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dayOfWeek = prevDate.getDay();
      allDays.push({
        date: d,
        monthOffset: -1,
        dateStr: prevDate.toISOString().split('T')[0],
        isToday: false,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        dayOfWeek,
      });
    }

    // 이번 달 날짜들
    for (let i = 1; i <= lastDateOfMonth; i++) {
      const curDate = new Date(year, month, i);
      const dayOfWeek = curDate.getDay();
      allDays.push({
        date: i,
        monthOffset: 0,
        dateStr: curDate.toISOString().split('T')[0],
        isToday: isCurrentMonth && i === todayDate,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        dayOfWeek,
      });
    }

    // 다음 달 날짜들 (총 35 또는 42셀 맞춤)
    const remainingCells = allDays.length <= 35 ? 35 - allDays.length : 42 - allDays.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dayOfWeek = nextDate.getDay();
      allDays.push({
        date: i,
        monthOffset: 1,
        dateStr: nextDate.toISOString().split('T')[0],
        isToday: false,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        dayOfWeek,
      });
    }

    // 7일씩 주(Week) 단위로 묶기
    const weekChunks: DayInfo[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weekChunks.push(allDays.slice(i, i + 7));
    }
    return weekChunks;
  }, [year, month]);

  // 이벤트 스타일 클래스 매핑
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

  // 주(Week) 단위 세그먼트 계산 (다일정 Bar 연속 렌더링 & 충돌 방지 Greedy Slot Allocation)
  const getWeekSegments = (week: DayInfo[]): EventSegment[] => {
    const weekStart = week[0].dateStr;
    const weekEnd = week[6].dateStr;

    const rawSegments: Omit<EventSegment, 'trackIndex'>[] = [];

    events.forEach((evt) => {
      const evtStart = evt.startDate.split('T')[0];
      const evtEnd = evt.endDate.split('T')[0];

      // 이번 주와 겹치는지 확인
      if (evtStart <= weekEnd && evtEnd >= weekStart) {
        const effectiveStart = evtStart < weekStart ? weekStart : evtStart;
        const effectiveEnd = evtEnd > weekEnd ? weekEnd : evtEnd;

        const startIdx = week.findIndex((d) => d.dateStr === effectiveStart);
        const endIdx = week.findIndex((d) => d.dateStr === effectiveEnd);

        if (startIdx !== -1 && endIdx !== -1) {
          rawSegments.push({
            event: evt,
            startCol: startIdx + 1,
            endCol: endIdx + 1,
            isStart: evtStart >= weekStart,
            isEnd: evtEnd <= weekEnd,
            isMultiDay: evtStart !== evtEnd,
          });
        }
      }
    });

    // 정렬: 다일정(Multi-day) 우선 -> 긴 기간 우선 -> 시작일 빠른 순
    rawSegments.sort((a, b) => {
      if (a.isMultiDay !== b.isMultiDay) return a.isMultiDay ? -1 : 1;
      const aSpan = a.endCol - a.startCol;
      const bSpan = b.endCol - b.startCol;
      if (aSpan !== bSpan) return bSpan - aSpan;
      if (a.startCol !== b.startCol) return a.startCol - b.startCol;
      return a.event.id.localeCompare(b.event.id);
    });

    // 충돌 없는 레벨(trackIndex) 할당
    const slots: Omit<EventSegment, 'trackIndex'>[][] = [];
    const segments: EventSegment[] = [];

    rawSegments.forEach((seg) => {
      let assignedTrack = -1;
      for (let i = 0; i < slots.length; i++) {
        const lastInSlot = slots[i][slots[i].length - 1];
        if (lastInSlot.endCol < seg.startCol) {
          slots[i].push(seg);
          assignedTrack = i;
          break;
        }
      }
      if (assignedTrack === -1) {
        assignedTrack = slots.length;
        slots.push([seg]);
      }
      segments.push({ ...seg, trackIndex: assignedTrack });
    });

    return segments;
  };

  return (
    <div className="calendar-month-grid">
      {/* 1. 상단 요일 헤더 */}
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

      {/* 2. 주(Week) 단위 행 렌더링 (연속 Bar Overlay 지원) */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {weeks.map((week, weekIdx) => {
          const segments = getWeekSegments(week);
          const maxTrack = segments.reduce((max, s) => Math.max(max, s.trackIndex), -1);
          // 최소 3개 슬롯(약 75px) 이상 확보하여 주 행의 기본 높이 유지
          const contentHeight = Math.max(85, (maxTrack + 1) * 22 + 32);

          return (
            <div
              key={`week-${weekIdx}`}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minHeight: `${contentHeight}px`,
                flex: 1,
                borderBottom: weekIdx < weeks.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              {/* 2.1 배경 날짜 셀 그리드 (빈 공간 클릭 시 날짜별 새 일감 모달 트리거) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  position: 'absolute',
                  inset: 0,
                  gap: '1px',
                  background: 'var(--border-subtle)',
                }}
              >
                {week.map((d) => (
                  <div
                    key={d.dateStr}
                    onClick={() => onDateClick(d.dateStr)}
                    className={`calendar-month-cell ${d.monthOffset !== 0 ? 'other-month' : ''}`}
                    style={{ position: 'relative', padding: '6px 8px' }}
                  >
                    {/* 일자 번호 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={
                          d.isToday
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
                                    : d.isWeekend
                                    ? d.dayOfWeek === 0
                                      ? '#f14c4c'
                                      : '#9cdcfe'
                                    : 'var(--text-bright)',
                                paddingLeft: '2px',
                              }
                        }
                      >
                        {d.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2.2 전경 연속 이벤트 Bar 레이어 (다일정 이음새 & 단일일정 칩) */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  marginTop: '28px',
                  marginBottom: '6px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridAutoRows: '20px',
                  rowGap: '2px',
                  padding: '0 2px',
                  pointerEvents: 'none',
                }}
              >
                {segments.map((seg) => {
                  const isDone =
                    seg.event.status?.toUpperCase() === 'DONE' ||
                    seg.event.status?.toUpperCase() === 'COMPLETED';

                  return (
                    <div
                      key={`seg-${seg.event.id}-${seg.startCol}-${seg.endCol}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(seg.event);
                      }}
                      className={`calendar-event-bar ${getEventClass(seg.event)}`}
                      style={{
                        gridColumn: `${seg.startCol} / ${seg.endCol + 1}`,
                        gridRow: seg.trackIndex + 1,
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        height: '20px',
                        padding: '0 6px',
                        margin: '0 1px',
                        borderRadius: `${seg.isStart ? '3px' : '0'} ${seg.isEnd ? '3px' : '0'} ${seg.isEnd ? '3px' : '0'} ${seg.isStart ? '3px' : '0'}`,
                        borderLeft: seg.isStart ? undefined : 'none',
                        borderRight: seg.isEnd ? undefined : 'none',
                      }}
                      title={`${seg.event.title} (${seg.event.startDate.split('T')[0]} ~ ${seg.event.endDate.split('T')[0]})`}
                    >
                      {/* 시작일이 아니면 좌측에 이어짐 표시(◀), 맞으면 도트 아이콘 */}
                      {!seg.isStart ? (
                        <span style={{ fontSize: '0.65rem', opacity: 0.75, flexShrink: 0 }}>◀</span>
                      ) : (
                        <span
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: 'currentColor',
                            flexShrink: 0,
                          }}
                        />
                      )}

                      {/* 이벤트 타이틀 및 프로젝트명 */}
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textDecoration: isDone ? 'line-through' : 'none',
                          opacity: isDone ? 0.6 : 1,
                          fontSize: '0.72rem',
                        }}
                      >
                        {seg.event.project?.key ? `[${seg.event.project.key}] ` : ''}
                        {seg.event.title}
                      </span>

                      {/* 종료일이 아니면 우측에 이어짐 표시(▶) */}
                      {!seg.isEnd && (
                        <span style={{ fontSize: '0.65rem', opacity: 0.75, flexShrink: 0, marginLeft: 'auto' }}>▶</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
