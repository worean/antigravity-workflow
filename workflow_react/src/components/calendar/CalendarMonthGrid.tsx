import React, { useMemo } from 'react';
import type { CalendarEvent } from '@/types';
import { usePrefStore } from '@/stores/usePrefStore';
import { parseColorToRgb } from '@/utils/colorUtils';
import { formatDateOnly, getEffectiveEventRange } from '@/utils/dateUtils';
import {
  generateMonthMatrix,
  calculateWeekEventSegments,
  getWeekdayNames,
  type CalendarDayCell as DayInfo,
  type EventTrackSegment as EventSegment,
} from '@/utils/calendarUtils';

interface CalendarMonthGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onDateClick: (dateStr: string) => void;
  isSundayStart?: boolean;
}

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onDateClick,
  isSundayStart: isSundayStartProp,
}) => {
  const storeSundayStart = usePrefStore((s) => s.isSundayStart);
  const isSunday = isSundayStartProp !== undefined ? isSundayStartProp : storeSundayStart;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // 1. 달력 일자 매트릭스 계산 (공통 calendarUtils 활용)
  const weeks = useMemo<DayInfo[][]>(() => {
    return generateMonthMatrix(year, month, isSunday);
  }, [year, month, isSunday]);

  // 이벤트 스타일 클래스 매핑
  const getEventClass = (evt: CalendarEvent) => {
    if (evt.type === 'caldav' || evt.source === 'caldav') return 'calendar-event-caldav caldav';
    if (evt.type === 'google') return 'calendar-event-google google';
    if (evt.type === 'sprint') return 'calendar-event-sprint';
    const p = evt.priority?.toUpperCase();
    if (p === 'URGENT' || p === 'CRITICAL') return 'calendar-event-urgent';
    if (p === 'HIGH') return 'calendar-event-high';
    if (p === 'MEDIUM') return 'calendar-event-medium';
    return 'calendar-event-low';
  };

  // 주(Week) 단위 세그먼트 계산 (공통 calendarUtils 활용)
  const getWeekSegments = (week: DayInfo[]): EventSegment[] => {
    return calculateWeekEventSegments(events, week);
  };

  return (
    <div className="calendar-month-grid">
      {/* 1. 상단 요일 헤더 (일요일 또는 월요일 시작) */}
      <div className="calendar-month-weekdays">
        {getWeekdayNames(isSunday).map((wd, offset) => {
          const dayOfWeek = isSunday ? offset : (offset + 1) % 7;
          return (
            <div
              key={dayOfWeek}
              style={{
                color: dayOfWeek === 0 ? '#f14c4c' : dayOfWeek === 6 ? '#9cdcfe' : 'var(--text-sub)',
              }}
            >
              {wd}
            </div>
          );
        })}
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
                flexShrink: 0,
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
                    {/* 일자 번호 및 공휴일 표시 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <span
                        style={
                          d.isToday
                            ? { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', fontWeight: 'bold', fontSize: '0.75rem' }
                            : {
                                fontSize: '0.78rem',
                                fontWeight: 500,
                                color: d.monthOffset !== 0
                                  ? 'var(--text-muted)'
                                  : d.isHoliday
                                  ? '#f14c4c'
                                  : d.dayOfWeek === 6
                                  ? '#9cdcfe'
                                  : 'var(--text-bright)',
                                paddingLeft: '2px',
                              }
                        }
                      >
                        {d.date}
                      </span>
                      {d.holidayName && (
                        <span
                          title={d.holidayName}
                          style={{
                            fontSize: '0.65rem',
                            color: d.monthOffset !== 0 ? 'var(--text-muted)' : '#f14c4c',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '70%',
                            letterSpacing: '-0.3px',
                          }}
                        >
                          {d.holidayName}
                        </span>
                      )}
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

                  const isCaldav = seg.event.type === 'caldav' || seg.event.source === 'caldav';
                  const calColor = isCaldav ? (seg.event.project?.color || '#8a2be2') : undefined;
                  const calRgb = calColor ? parseColorToRgb(calColor) : null;

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
                        borderLeft: calRgb ? (seg.isStart ? `3px solid ${calColor}` : 'none') : (seg.isStart ? undefined : 'none'),
                        borderRight: seg.isEnd ? undefined : 'none',
                        background: calRgb ? `rgba(${calRgb.r}, ${calRgb.g}, ${calRgb.b}, 0.22)` : undefined,
                        borderColor: calRgb ? `rgba(${calRgb.r}, ${calRgb.g}, ${calRgb.b}, 0.5)` : undefined,
                        color: calRgb ? '#ffffff' : undefined,
                      }}
                      title={`${seg.event.title} (${formatDateOnly(seg.event.startDate)}${seg.event.endDate && formatDateOnly(seg.event.startDate) !== getEffectiveEventRange(seg.event.startDate, seg.event.endDate).endDateOnly ? ` ~ ${getEffectiveEventRange(seg.event.startDate, seg.event.endDate).endDateOnly}` : ''})`}
                    >
                      {/* 시작일/이음새 도트 표시 (CalDAV/Google 아이콘 제거) */}
                      {!seg.isStart ? (
                        <span style={{ fontSize: '0.65rem', opacity: 0.75, flexShrink: 0 }}>◀</span>
                      ) : !isCaldav ? (
                        <span
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: 'currentColor',
                            flexShrink: 0,
                          }}
                        />
                      ) : null}

                      {/* 이벤트 타이틀 (CalDAV는 고유 제목만, 이슈는 [KEY] 표시) */}
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textDecoration: isDone ? 'line-through' : 'none',
                          opacity: isDone ? 0.6 : 1,
                          fontSize: '0.72rem',
                          fontWeight: 500,
                        }}
                      >
                        {seg.event.type !== 'caldav' && seg.event.type !== 'google' && seg.event.project?.key
                          ? `[${seg.event.project.key}] `
                          : ''}
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
