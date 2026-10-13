import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import type { Worklog, Issue } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';
import { Spinner } from '@/components/common';

interface ProjectWorklogsTabProps {
  worklogs: Worklog[];
  isLoading: boolean;
  onSelectIssue?: (issue: Issue) => void;
}

/**
 * 분 단위 작업 시간을 사람이 읽기 쉬운 형식(예: 2시간 30분)으로 변환
 */
const formatTimeSpent = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0분';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}시간 ${remainingMinutes}분`;
  }
  if (hours > 0) {
    return `${hours}시간`;
  }
  return `${remainingMinutes}분`;
};

export const ProjectWorklogsTab: React.FC<ProjectWorklogsTabProps> = ({
  worklogs,
  isLoading,
  onSelectIssue,
}) => {
  if (isLoading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
        <Spinner centered label="작업 로그를 불러오는 중입니다..." />
      </div>
    );
  }

  if (!worklogs || worklogs.length === 0) {
    return (
      <div
        style={{
          padding: '36px 16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
          borderRadius: 'var(--radius-xs)',
          border: '1px dashed var(--border-light)',
        }}
      >
        <Clock size={28} style={{ marginBottom: '8px', opacity: 0.6 }} />
        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>등록된 작업 로그가 없습니다.</div>
        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
          이슈 상세 창에서 실제 작업 시간을 기록하면 이곳에 타임라인으로 누적됩니다.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {worklogs.map((log) => {
        const user = log.user;
        const issue = log.issue;

        return (
          <div
            key={log.id}
            style={{
              padding: '10px 14px',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'border-color 0.15s ease',
            }}
          >
            {/* Top row: Issue Title & Time badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {issue ? (
                  <button
                    type="button"
                    onClick={() => onSelectIssue && onSelectIssue(issue as any)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      cursor: onSelectIssue ? 'pointer' : 'default',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--text-bright)',
                      fontWeight: 600,
                      fontSize: '0.83rem',
                    }}
                    title="이슈 상세 보기"
                  >
                    <span
                      style={{
                        color: 'var(--primary)',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        background: 'var(--primary-subtle)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                      }}
                    >
                      #{issue.id}
                    </span>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '380px',
                      }}
                    >
                      {issue.title}
                    </span>
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    삭제되거나 알 수 없는 이슈
                  </span>
                )}
              </div>

              {/* Time Spent Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--primary-subtle, rgba(59, 130, 246, 0.1))',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <Clock size={12} />
                <span>{formatTimeSpent(log.timeSpent)}</span>
              </div>
            </div>

            {/* Middle row: Description if present */}
            {log.description && (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-main)',
                  background: 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4,
                  borderLeft: '3px solid var(--border-focus)',
                }}
              >
                {log.description}
              </div>
            )}

            {/* Bottom row: Worker info and recorded date */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                paddingTop: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || '작업자'}
                    style={{ width: '16px', height: '16px', borderRadius: '50%' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: user?.avatarColor || 'var(--primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 700,
                    }}
                  >
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
                <span>{user?.name || user?.email || '작업자'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} />
                <span>{formatDateTime(log.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
