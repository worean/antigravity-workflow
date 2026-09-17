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

  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE':
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-3 min-h-[500px]">
      {weekDays.map((day, idx) => {
        const dayEvents = getEventsForDate(day.dateStr);

        return (
          <div
            key={day.dateStr}
            onClick={() => onDateClick(day.dateStr)}
            className={`flex flex-col rounded-xl border p-2.5 transition-colors cursor-pointer bg-gray-900/40 hover:bg-gray-900/60 ${
              day.isToday
                ? 'border-blue-500/50 shadow-md shadow-blue-950/20'
                : 'border-gray-800'
            }`}
          >
            {/* 요일 및 날짜 헤더 */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-800/80 mb-2">
              <span
                className={`text-xs font-semibold ${
                  idx === 0
                    ? 'text-red-400'
                    : idx === 6
                    ? 'text-blue-400'
                    : 'text-gray-300'
                }`}
              >
                {day.name}
              </span>
              <span
                className={`inline-flex items-center justify-center text-xs font-bold w-5 h-5 rounded-full ${
                  day.isToday ? 'bg-blue-600 text-white' : 'text-gray-400'
                }`}
              >
                {day.date}
              </span>
            </div>

            {/* 일정 리스트 */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
              {dayEvents.length === 0 ? (
                <div className="flex items-center justify-center flex-1 text-[11px] text-gray-400 py-6">
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
                      className="p-2 rounded-lg bg-gray-950/70 border border-gray-800 hover:border-gray-700 transition-all text-xs flex flex-col gap-1.5 shadow-sm group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        {evt.project && (
                          <span className="text-[10px] font-medium text-gray-400 truncate">
                            {evt.project.key || evt.project.name}
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${getStatusBadge(
                            evt.status
                          )}`}
                        >
                          {evt.status || 'TODO'}
                        </span>
                      </div>

                      <p
                        className={`font-medium text-gray-200 line-clamp-2 ${
                          isDone ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {evt.title}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-900 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{evt.endDate.split('T')[0].slice(5)}</span>
                        </span>

                        {evt.assignee && (
                          <span className="flex items-center gap-1 font-medium text-gray-400">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[60px]">
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
