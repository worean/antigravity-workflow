import React from 'react';
import { Clock, User } from 'lucide-react';
import type { CalendarEvent } from '@/types';

interface CalendarWeekGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onDateClick: (dateStr: string) => void;
}

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export const CalendarWeekGrid: React.FC<CalendarWeekGridProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onDateClick,
}) => {
  // 1. 현재 날짜가 속한 주의 일요일(시작일) 계산
  const startOfWeek = new Date(currentDate);
  const currentDay = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - currentDay);

  const today = new Date().toISOString().split('T')[0];

  const weekDays: { name: string; date: number; dateStr: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    weekDays.push({
      name: WEEKDAYS[i],
      date: d.getDate(),
      dateStr,
      isToday: dateStr === today,
    });
  }

  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => {
      const start = e.startDate.split('T')[0];
      const end = e.endDate.split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const getStatusBadgeStyle = (status?: string): React.CSSProperties => {
    switch (status?.toUpperCase()) {
      case 'DONE':
      case 'COMPLETED':
        return {
          background: 'rgba(46, 160, 67, 0.15)',
          color: '#4ec9b0',
          border: '1px solid rgba(46, 160, 67, 0.3)',
        };
      case 'IN_PROGRESS':
        return {
          background: 'rgba(0, 122, 204, 0.15)',
          color: '#9cdcfe',
          border: '1px solid rgba(0, 122, 204, 0.3)',
        };
      default:
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-sub)',
          border: '1px solid var(--border-light)',
        };
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', flex: 1, minHeight: '520px' }}>
      {weekDays.map((day, idx) => {
        const dayEvents = getEventsForDate(day.dateStr);

        return (
          <div
            key={day.dateStr}
            onClick={() => onDateClick(day.dateStr)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-card)',
              border: day.isToday ? '1px solid var(--primary)' : '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.12s ease',
              overflow: 'hidden',
              boxShadow: day.isToday ? '0 0 8px rgba(0, 122, 204, 0.25)' : 'none',
            }}
          >
            {/* 요일 및 날짜 헤더 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '6px',
                borderBottom: '1px solid var(--border-light)',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color:
                    idx === 0
                      ? '#f14c4c'
                      : idx === 6
                      ? '#9cdcfe'
                      : 'var(--text-sub)',
                }}
              >
                {day.name}
              </span>
              <span
                style={
                  day.isToday
                    ? {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                      }
                    : {
                        fontSize: '0.78rem',
                        color: 'var(--text-bright)',
                        fontWeight: 500,
                      }
                }
              >
                {day.date}
              </span>
            </div>

            {/* 일정 리스트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
              {dayEvents.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: '0.75rem', color: 'var(--text-muted)', padding: '20px 0' }}>
                  일정 없음
                </div>
              ) : (
                dayEvents.map((evt) => {
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
                      style={{
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'border-color 0.12s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        {evt.project && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {evt.project.key || evt.project.name}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-xs)',
                            fontWeight: 600,
                            ...getStatusBadgeStyle(evt.status),
                          }}
                        >
                          {evt.status || 'TODO'}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontWeight: 500,
                          color: 'var(--text-bright)',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          textDecoration: isDone ? 'line-through' : 'none',
                          opacity: isDone ? 0.6 : 1,
                        }}
                      >
                        {evt.title}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '4px',
                          borderTop: '1px solid var(--border-subtle)',
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} />
                          <span>{evt.endDate.split('T')[0].slice(5)}</span>
                        </span>

                        {evt.assignee && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <User size={11} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60px' }}>
                              {evt.assignee.name}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
