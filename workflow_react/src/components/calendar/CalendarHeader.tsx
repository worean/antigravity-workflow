import React from 'react';
import { ChevronLeft, ChevronRight, Plus, UserCheck } from 'lucide-react';
import type { CalendarViewMode, Project } from '@/types';
import { useUIStore } from '@/stores/useUIStore';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  projects?: Project[];
  selectedProjectId: number | 'ALL';
  onProjectChange: (projectId: number | 'ALL') => void;
  onNewIssue?: () => void;
  onlyMyEvents?: boolean;
  onOnlyMyEventsChange?: (onlyMy: boolean) => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  projects = [],
  selectedProjectId,
  onProjectChange,
  onNewIssue,
  onlyMyEvents = false,
  onOnlyMyEventsChange,
}) => {
  const openIssueModal = useUIStore((s) => s.openIssueModal);
  const handleNewIssue = onNewIssue || (() => openIssueModal(selectedProjectId === 'ALL' ? undefined : selectedProjectId));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 주간 뷰일 경우 해당 주의 시작일과 종료일 계산
  const getWeekRangeLabel = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startStr = `${startOfWeek.getMonth() + 1}.${startOfWeek.getDate()}`;
    const endStr = `${endOfWeek.getMonth() + 1}.${endOfWeek.getDate()}`;
    return `(${startStr} ~ ${endStr})`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      {/* 1. 날짜 네비게이션 및 범례 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 4px',
          }}
        >
          <button
            type="button"
            onClick={onPrev}
            className="btn btn-secondary btn-icon btn-sm"
            title="이전"
            style={{ width: '24px', height: '24px', padding: 0 }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="btn btn-secondary btn-sm"
            style={{ height: '24px', padding: '0 8px', fontSize: '0.75rem' }}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={onNext}
            className="btn btn-secondary btn-icon btn-sm"
            title="다음"
            style={{ width: '24px', height: '24px', padding: 0 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-bright)', margin: 0 }}>
            {year}년 {month}월
          </h2>
          {viewMode === 'week' && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {getWeekRangeLabel()}
            </span>
          )}
        </div>

        {/* 일정 범례 (Legend) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-sub)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#007acc' }} />
            이슈
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#c586c0' }} />
            스프린트
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#4285F4' }} />
            Google 일정
          </span>
        </div>
      </div>

      {/* 2. 필터 및 뷰 체인저, 액션 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* '내 일정만 보기' 토글 버튼 */}
        {onOnlyMyEventsChange && (
          <button
            type="button"
            onClick={() => onOnlyMyEventsChange(!onlyMyEvents)}
            className={`btn btn-sm ${onlyMyEvents ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              height: '26px',
              fontSize: '0.75rem',
              gap: '5px',
              border: onlyMyEvents ? '1px solid var(--primary)' : '1px solid var(--border-light)',
            }}
            title="담당자 또는 보고자가 나인 이슈만 필터링합니다"
          >
            <UserCheck size={13} />
            <span>{onlyMyEvents ? '내 일정만 보는 중' : '내 일정만 보기'}</span>
          </button>
        )}

        {/* 프로젝트 필터 */}
        <select
          value={selectedProjectId}
          onChange={(e) =>
            onProjectChange(
              e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
            )
          }
          className="input-field"
          style={{ width: '140px', height: '26px', fontSize: '0.78rem' }}
        >
          <option value="ALL">전체 프로젝트</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* 뷰 모드 토글 (월간 / 주간) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ height: '22px', fontSize: '0.75rem', padding: '0 8px' }}
          >
            월간
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ height: '22px', fontSize: '0.75rem', padding: '0 8px' }}
          >
            주간
          </button>
        </div>

        {/* 새 일감 등록 */}
        <button
          type="button"
          onClick={handleNewIssue}
          className="btn btn-primary btn-sm"
          style={{ height: '26px' }}
        >
          <Plus size={13} />
          <span>새 일감</span>
        </button>
      </div>
    </div>
  );
};
