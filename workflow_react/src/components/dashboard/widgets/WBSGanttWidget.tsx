import React, { useMemo } from 'react';
import { useIssues } from '@/api/issues';
import { Spinner, StatusBadge } from '@/components/common';
import { formatDateOnly, diffDays } from '@/utils/dateUtils';
import type { Issue } from '@/types';
import type { DashboardWidgetConfig } from '@/types/dashboard';

interface WBSGanttWidgetProps {
  config?: DashboardWidgetConfig;
  onSelectIssue?: (issue: Issue) => void;
}

export const WBSGanttWidget: React.FC<WBSGanttWidgetProps> = ({
  config = {},
  onSelectIssue,
}) => {
  const projectId = config.projectId === 'ALL' ? undefined : config.projectId;
  const { data: issues = [], isLoading } = useIssues(
    { projectId: projectId || undefined, all: true },
    { enabled: true }
  );

  // 타임라인 기준 범위 계산 (최근 14일 전부터 30일 후까지)
  const { timelineStart, totalDays } = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { timelineStart: start, totalDays: 35 };
  }, []);

  const dayWidth = 24; // 1일 너비 px

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px' }}>
        <Spinner centered label="WBS 데이터를 불러오는 중..." />
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        등록된 일감이 없습니다.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '220px',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xs)',
      }}
    >
      {/* Scrollable Container with Split Tree & Gantt View */}
      <div style={{ flex: 1, display: 'flex', overflow: 'auto' }}>
        {/* Left: Issue Info List */}
        <div
          style={{
            width: '280px',
            minWidth: '240px',
            borderRight: '1px solid var(--border-light)',
            flexShrink: 0,
            background: 'var(--bg-subtle)',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--text-sub)',
              borderBottom: '1px solid var(--border-light)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            일감 목록 ({issues.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {issues.slice(0, 30).map((iss) => (
              <div
                key={iss.id}
                onClick={() => onSelectIssue && onSelectIssue(iss)}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 8px',
                  borderBottom: '1px solid var(--border-divider)',
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                title={`#${iss.id} ${iss.title}`}
              >
                <span style={{ fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                  #{iss.id}
                </span>
                <StatusBadge status={iss.statusId || iss.status} size="sm" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-bright)' }}>
                  {iss.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Gantt Timeline Bars */}
        <div style={{ flex: 1, minWidth: `${totalDays * dayWidth}px`, position: 'relative' }}>
          {/* Timeline Header (Days) */}
          <div
            style={{
              height: '29px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            {Array.from({ length: totalDays }).map((_, idx) => {
              const d = new Date(timelineStart);
              d.setDate(d.getDate() + idx);
              const isToday = new Date().toDateString() === d.toDateString();
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div
                  key={idx}
                  style={{
                    width: `${dayWidth}px`,
                    flexShrink: 0,
                    textAlign: 'center',
                    fontSize: '0.64rem',
                    lineHeight: '28px',
                    color: isToday ? 'var(--primary)' : isWeekend ? 'var(--text-muted)' : 'var(--text-sub)',
                    fontWeight: isToday ? 700 : 400,
                    borderRight: '1px solid var(--border-divider)',
                    background: isToday ? 'rgba(0, 122, 204, 0.1)' : undefined,
                  }}
                  title={formatDateOnly(d)}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>

          {/* Timeline Bars for each issue */}
          <div>
            {issues.slice(0, 30).map((iss) => {
              const pStart = iss.plannedStartDate ? new Date(iss.plannedStartDate) : new Date();
              const pEnd = iss.dueDate ? new Date(iss.dueDate) : new Date(pStart);
              if (pEnd < pStart) pEnd.setTime(pStart.getTime());

              const offsetDays = Math.max(0, diffDays(timelineStart, pStart));
              const durationDays = Math.max(1, diffDays(pStart, pEnd) + 1);

              const leftPx = offsetDays * dayWidth;
              const widthPx = durationDays * dayWidth - 4;

              return (
                <div
                  key={iss.id}
                  style={{
                    height: '32px',
                    position: 'relative',
                    borderBottom: '1px solid var(--border-divider)',
                  }}
                >
                  <div
                    onClick={() => onSelectIssue && onSelectIssue(iss)}
                    style={{
                      position: 'absolute',
                      left: `${leftPx}px`,
                      width: `${Math.max(20, widthPx)}px`,
                      top: '6px',
                      height: '20px',
                      background: 'linear-gradient(90deg, #007acc 0%, #0098ff 100%)',
                      borderRadius: 'var(--radius-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 6px',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      color: 'var(--text-on-primary)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      userSelect: 'none',
                    }}
                    title={`#${iss.id} ${iss.title} (${formatDateOnly(pStart)} ~ ${formatDateOnly(pEnd)})`}
                  >
                    {iss.progress !== undefined && iss.progress > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${iss.progress}%`,
                          background: 'rgba(78, 201, 176, 0.65)',
                          borderRadius: 'var(--radius-xs) 0 0 var(--radius-xs)',
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                      {iss.progress || 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
