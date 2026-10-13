import React from 'react';
import { StatusBadge } from '@/components/common';
import { RotateCcw } from 'lucide-react';
import type { Issue } from '@/types';

interface CalendarMiniListProps {
  selectedDateStr: string | null;
  onClearSelectedDate: () => void;
  activeListIssues: Issue[];
  currentMonth: number;
  onSelectIssue?: (issue: Issue) => void;
}

export const CalendarMiniList: React.FC<CalendarMiniListProps> = ({
  selectedDateStr,
  onClearSelectedDate,
  activeListIssues,
  currentMonth,
  onSelectIssue,
}) => {
  return (
    <div
      style={{
        marginTop: '8px',
        paddingTop: '6px',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-sub)' }}>
          {selectedDateStr
            ? `${selectedDateStr} 일정 (${activeListIssues.length}건)`
            : `${currentMonth + 1}월 전체 일정 리스트 (${activeListIssues.length}건)`}
        </span>
        {selectedDateStr && (
          <button
            type="button"
            onClick={onClearSelectedDate}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.68rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '1px 4px',
            }}
          >
            <RotateCcw size={10} /> 전체 보기
          </button>
        )}
      </div>

      <div
        style={{
          maxHeight: '130px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          paddingRight: '2px',
        }}
      >
        {activeListIssues.length === 0 ? (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
            {selectedDateStr ? '선택한 일자에 일감이 없습니다.' : '이달에 등록된 일정이 없습니다.'}
          </div>
        ) : (
          activeListIssues.map((iss) => {
            const targetDate = iss.dueDate || iss.plannedStartDate;
            const dateOnly = targetDate ? targetDate.substring(5, 10) : '';
            return (
              <div
                key={iss.id}
                onClick={() => onSelectIssue && onSelectIssue(iss)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 6px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-divider)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              >
                {dateOnly && (
                  <span style={{ fontSize: '0.66rem', color: 'var(--accent-cyan)', flexShrink: 0, fontWeight: 600 }}>
                    {dateOnly}
                  </span>
                )}
                <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>
                  #{iss.id}
                </span>
                <StatusBadge status={iss.statusId || iss.status} size="sm" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-bright)' }}>
                  {iss.title}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
