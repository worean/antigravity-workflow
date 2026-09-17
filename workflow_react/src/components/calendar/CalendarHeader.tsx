import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { CalendarViewMode, Project } from '@/types';

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
  onNewIssue: () => void;
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
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-gray-800">
      {/* 1. 날짜 네비게이션 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          <button
            type="button"
            onClick={onPrev}
            className="p-1.5 rounded text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            title="이전"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="px-2.5 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-1.5 rounded text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            title="다음"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-bold text-gray-100">
            {year}년 {month}월
          </h2>
          {viewMode === 'week' && (
            <span className="text-xs text-gray-400 font-medium">
              {getWeekRangeLabel()}
            </span>
          )}
        </div>
      </div>

      {/* 2. 필터 및 뷰 체인저, 액션 버튼 */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
        {/* 프로젝트 필터 */}
        <select
          value={selectedProjectId}
          onChange={(e) =>
            onProjectChange(
              e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
            )
          }
          className="bg-gray-900 border border-gray-800 rounded-lg text-xs px-2.5 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">전체 프로젝트</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* 뷰 모드 토글 (월간 / 주간) */}
        <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            월간
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            주간
          </button>
        </div>

        {/* 새 일감 등록 */}
        <button
          type="button"
          onClick={onNewIssue}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 일감</span>
        </button>
      </div>
    </div>
  );
};
