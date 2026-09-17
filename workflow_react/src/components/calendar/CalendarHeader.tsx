import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
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
      {/* 1. 날짜 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
      </div>

      {/* 2. 필터 및 뷰 체인저, 액션 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* 프로젝트 필터 */}
        <select
          value={selectedProjectId}
          onChange={(e) =>
            onProjectChange(
              e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
            )
          }
          className="input-field"
          style={{ width: '150px', height: '26px', fontSize: '0.78rem' }}
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
