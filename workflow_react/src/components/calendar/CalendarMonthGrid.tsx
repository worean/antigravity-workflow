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

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden select-none">
      {/* 1. 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-800 bg-gray-900 text-xs font-semibold text-center py-2.5">
        {WEEKDAYS.map((w, idx) => (
          <div
            key={w}
            className={`${
              idx === 0
                ? 'text-red-400'
                : idx === 6
                ? 'text-blue-400'
                : 'text-gray-400'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 2. 날짜 셀 그리드 */}
      <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-gray-800/80 bg-gray-950">
        {days.map((d, index) => {
          const isToday = isCurrentMonth && d.monthOffset === 0 && d.date === todayDate;
          const dayEvents = getEventsForDate(d.dateStr);
          const isWeekend = index % 7 === 0 || index % 7 === 6;

          return (
            <div
              key={`${d.dateStr}-${index}`}
              onClick={() => onDateClick(d.dateStr)}
              className={`min-h-[105px] p-1.5 flex flex-col transition-colors cursor-pointer group ${
                d.monthOffset !== 0 ? 'bg-gray-950/40 text-gray-600' : 'hover:bg-gray-900/40'
              }`}
            >
              {/* 날짜 표시 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center text-xs font-medium w-6 h-6 rounded-full transition-colors ${
                    isToday
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : d.monthOffset === 0
                      ? isWeekend
                        ? index % 7 === 0
                          ? 'text-red-400'
                          : 'text-blue-400'
                        : 'text-gray-300'
                      : 'text-gray-600'
                  }`}
                >
                  {d.date}
                </span>

                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-gray-400 px-1 font-mono">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* 이벤트 칩 목록 (최대 3개) */}
              <div className="flex flex-col gap-1 overflow-hidden flex-1">
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
                      className={`px-1.5 py-0.5 rounded text-[11px] truncate border font-medium flex items-center gap-1 transition-transform hover:scale-[1.02] ${
                        evt.type === 'sprint'
                          ? 'bg-purple-900/40 text-purple-200 border-purple-700/50'
                          : getPriorityColor(evt.priority)
                      }`}
                      title={`${evt.title} (${evt.status || ''})`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <span className={`truncate ${isDone ? 'line-through opacity-60' : ''}`}>
                        {evt.title}
                      </span>
                    </div>
                  );
                })}

                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-400 font-medium px-1">
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
