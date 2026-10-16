import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import type { Issue } from '@/types';
import { formatDateOnly } from '@/utils/dateUtils';
import { Spinner } from '@/components/common';

const getCategoryColor = (cat?: string): { color: string; bg: string } => {
  switch (cat?.toUpperCase()) {
    case 'DONE':
      return { color: 'var(--badge-done-text)', bg: 'var(--badge-done-bg)' };
    case 'IN_PROGRESS':
      return { color: 'var(--primary)', bg: 'var(--badge-progress-bg)' };
    case 'IN_REVIEW':
      return { color: 'var(--badge-review-text)', bg: 'var(--badge-review-bg)' };
    default:
      return { color: 'var(--text-sub)', bg: 'var(--badge-todo-bg)' };
  }
};

interface ProjectTodoIssuesTabProps {
  issues: Issue[];
  isLoading: boolean;
  onSelectIssue?: (issue: Issue) => void;
  onGoToBoard?: () => void;
}

type FilterMode = 'active' | 'todo' | 'in_progress' | 'all';

export const ProjectTodoIssuesTab: React.FC<ProjectTodoIssuesTabProps> = ({
  issues,
  isLoading,
  onSelectIssue,
  onGoToBoard,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('active');

  if (isLoading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
        <Spinner centered label="이슈 목록을 불러오는 중입니다..." />
      </div>
    );
  }

  // 필터링 적용
  const filteredIssues = issues.filter((issue) => {
    const category = issue.status?.category?.toUpperCase() || '';
    if (filterMode === 'active') {
      return category === 'TODO' || category === 'IN_PROGRESS';
    }
    if (filterMode === 'todo') {
      return category === 'TODO';
    }
    if (filterMode === 'in_progress') {
      return category === 'IN_PROGRESS';
    }
    return true; // 'all'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Filter Chips Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '4px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            style={{
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filterMode === 'active' ? 'var(--primary)' : 'var(--border-light)',
              background: filterMode === 'active' ? 'var(--primary-subtle)' : 'transparent',
              color: filterMode === 'active' ? 'var(--primary)' : 'var(--text-sub)',
            }}
          >
            진행 대상 (할 일 + 진행중)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('todo')}
            style={{
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filterMode === 'todo' ? 'var(--primary)' : 'var(--border-light)',
              background: filterMode === 'todo' ? 'var(--primary-subtle)' : 'transparent',
              color: filterMode === 'todo' ? 'var(--primary)' : 'var(--text-sub)',
            }}
          >
            할 일 (TODO)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('in_progress')}
            style={{
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filterMode === 'in_progress' ? 'var(--primary)' : 'var(--border-light)',
              background: filterMode === 'in_progress' ? 'var(--primary-subtle)' : 'transparent',
              color: filterMode === 'in_progress' ? 'var(--primary)' : 'var(--text-sub)',
            }}
          >
            진행 중
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filterMode === 'all' ? 'var(--primary)' : 'var(--border-light)',
              background: filterMode === 'all' ? 'var(--primary-subtle)' : 'transparent',
              color: filterMode === 'all' ? 'var(--primary)' : 'var(--text-sub)',
            }}
          >
            전체 ({issues.length})
          </button>
        </div>

        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          선택된 항목: {filteredIssues.length}건
        </span>
      </div>

      {filteredIssues.length === 0 ? (
        <div
          style={{
            padding: '36px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-xs)',
            border: '1px dashed var(--border-light)',
          }}
        >
          <CheckCircle2 size={28} style={{ marginBottom: '8px', opacity: 0.6 }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
            {filterMode === 'active'
              ? '현재 진행 대기 또는 진행 중인 이슈가 없습니다.'
              : '해당 조건의 이슈가 없습니다.'}
          </div>
          {onGoToBoard && (
            <button
              type="button"
              onClick={onGoToBoard}
              style={{
                marginTop: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                color: 'var(--primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>칸반 보드로 이동</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredIssues.map((issue) => {
            const isDone = issue.status?.category?.toUpperCase() === 'DONE';
            const isInProgress = issue.status?.category?.toUpperCase() === 'IN_PROGRESS';
            const progress = issue.progress ?? 0;

            return (
              <div
                key={issue.id}
                onClick={() => onSelectIssue && onSelectIssue(issue)}
                style={{
                  padding: '9px 12px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  cursor: onSelectIssue ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-focus)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              >
                {/* Left: Status Icon, Key, Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  {isDone ? (
                    <CheckCircle2 size={16} color="var(--badge-done-text)" style={{ flexShrink: 0 }} />
                  ) : isInProgress ? (
                    <Clock size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                  ) : (
                    <Circle size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  )}

                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: 'var(--text-sub)',
                      background: 'var(--bg-subtle)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      flexShrink: 0,
                    }}
                  >
                    #{issue.id}
                  </span>

                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: isDone ? 'var(--text-muted)' : 'var(--text-bright)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {issue.title}
                  </span>
                </div>

                {/* Right: Status badge, Progress, Assignee, DueDate */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {/* Progress bar (진행중인 경우) */}
                  {isInProgress && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '70px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '5px',
                          background: 'var(--bg-subtle)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'var(--primary)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '24px', textAlign: 'right' }}>
                        {progress}%
                      </span>
                    </div>
                  )}

                  {/* Status Badge */}
                  {issue.status && (() => {
                    const statusTheme = getCategoryColor(issue.status.category);
                    return (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: statusTheme.bg,
                          color: statusTheme.color,
                          fontWeight: 600,
                          border: '1px solid var(--border-light)',
                        }}
                      >
                        {issue.status.name}
                      </span>
                    );
                  })()}

                  {/* Due Date */}
                  {issue.dueDate && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Calendar size={11} />
                      {formatDateOnly(issue.dueDate)}
                    </span>
                  )}

                  {/* Assignee */}
                  {issue.assignee ? (
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      title={`담당자: ${issue.assignee.name || issue.assignee.email}`}
                    >
                      {issue.assignee.avatar ? (
                        <img
                          src={issue.assignee.avatar}
                          alt={issue.assignee.name || '담당자'}
                          style={{ width: '18px', height: '18px', borderRadius: '50%' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: issue.assignee.avatarColor || 'var(--primary)',
                            color: 'var(--text-on-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 700,
                          }}
                        >
                          {issue.assignee.name?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      미지정
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
