import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Portal } from '@/components/common/Portal';
import { usePrefStore } from '@/stores/usePrefStore';
import { formatEventStartTime } from '@/utils/dateUtils';
import { sortCalendarEvents } from '@/utils/calendarUtils';
import type { CalendarEvent } from '@/types';

export interface CalendarPopupAnchor {
  dateStr: string;
  /** 클릭한 화면 좌표 (clientX / clientY) */
  x: number;
  y: number;
}

interface CalendarDayPopupProps {
  anchor: CalendarPopupAnchor | null;
  events: CalendarEvent[];
  onClose: () => void;
  onSelectEvent?: (event: CalendarEvent) => void;
}

const POPUP_WIDTH = 300;
const POPUP_OFFSET = 8;
const VIEWPORT_MARGIN = 8;
const POPUP_Z_INDEX = 1150;

/** 이벤트 종류별 표시 색상 (캘린더 일정 화면과 동일 기준: 프로젝트/캘린더 색상 우선) */
export const getCalendarEventColor = (evt: CalendarEvent): string => {
  if (evt.project?.color) return evt.project.color;
  if (evt.type === 'caldav' || evt.source === 'caldav') return 'var(--accent-caldav)';
  if (evt.type === 'google') return 'var(--accent-cyan)';
  if (evt.type === 'sprint') return 'var(--accent-amber)';
  return 'var(--primary)';
};


/**
 * 날짜 클릭 위치에 표시되는 비모달 팝오버.
 * - Portal 로 렌더링하여 위젯의 overflow 에 잘리지 않음
 * - 바깥 클릭 / ESC 로 닫힘, 화면 밖으로 넘치면 뷰포트 안으로 보정
 */
export const CalendarDayPopup: React.FC<CalendarDayPopupProps> = ({
  anchor,
  events,
  onClose,
  onSelectEvent,
}) => {
  const timeFormat = usePrefStore((s) => s.timeFormat);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // 1순위: 이슈 최상단, 2순위: 종일 일정(기간 긴 순), 3순위: 시간제 일정(시작 시간 빠른 순)
  const sortedEvents = useMemo(() => sortCalendarEvents(events), [events]);

  // 렌더 후 실제 크기를 측정하여 뷰포트 안으로 위치 보정
  useLayoutEffect(() => {
    if (!anchor) {
      setPos(null);
      return;
    }
    const height = popupRef.current?.offsetHeight ?? 0;
    const maxLeft = window.innerWidth - POPUP_WIDTH - VIEWPORT_MARGIN;
    const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
    setPos({
      left: Math.max(VIEWPORT_MARGIN, Math.min(anchor.x + POPUP_OFFSET, maxLeft)),
      top: Math.max(VIEWPORT_MARGIN, Math.min(anchor.y + POPUP_OFFSET, maxTop)),
    });
  }, [anchor, events.length]);

  // 바깥 클릭 / ESC 닫기
  useEffect(() => {
    if (!anchor) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchor, onClose]);

  if (!anchor) return null;

  return (
    <Portal>
      <div
        ref={popupRef}
        role="dialog"
        aria-label={`${anchor.dateStr} 일정`}
        style={{
          position: 'fixed',
          left: pos?.left ?? anchor.x + POPUP_OFFSET,
          top: pos?.top ?? anchor.y + POPUP_OFFSET,
          visibility: pos ? 'visible' : 'hidden',
          width: `${POPUP_WIDTH}px`,
          zIndex: POPUP_Z_INDEX,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-lg)',
          padding: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-bright)' }}>
            <CalendarDays size={14} color="var(--primary)" />
            {anchor.dateStr} ({events.length}건)
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '260px', overflowY: 'auto' }}>
          {sortedEvents.length === 0 ? (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', padding: '14px 0' }}>
              선택한 일자에 일정이 없습니다.
            </div>
          ) : (
            sortedEvents.map((evt: CalendarEvent) => {
              const startTimeStr = formatEventStartTime(evt.startDate, timeFormat, (evt as any).isAllDay);
              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent?.(evt)}
                  title={evt.description || evt.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-divider)',
                    borderLeft: `3px solid ${getCalendarEventColor(evt)}`,
                    fontSize: '0.76rem',
                    cursor: onSelectEvent ? 'pointer' : 'default',
                  }}
                >
                  {startTimeStr && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {startTimeStr}
                    </span>
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-bright)' }}>
                    {evt.issueId ? `#${evt.issueId} ` : ''}
                    {evt.title}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Portal>
  );
};