// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, ExternalLink, UserCheck, Calendar } from 'lucide-react';
import type { SprintWorklogItem } from '../../types';
import { getSprintWorklogs } from '../../services/api';
import { Avatar, Button, Spinner, StatusBadge } from '../common';
import { formatDateOnly, formatTimeAgo } from '../../utils/dateUtils';
import { minutesToHours } from '../../utils/worklogUtils';

interface SprintWorklogsTabProps {
  sprintId: number;
  sprintIssuesCount: number;
  onOpenIssueDetail?: (issueId: number) => void;
}

export const SprintWorklogsTab: React.FC<SprintWorklogsTabProps> = ({
  sprintId,
  sprintIssuesCount,
  onOpenIssueDetail,
}) => {
  const [worklogs, setWorklogs] = useState<SprintWorklogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWorklogs = async () => {
    setLoading(true);
    try {
      const data = await getSprintWorklogs(sprintId);
      setWorklogs(data);
    } catch (err) {
      console.error('Failed to fetch sprint worklogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklogs();
  }, [sprintId]);

  // 통계 계산
  const totalMinutes = worklogs.reduce((sum, w) => sum + (w.timeSpent || (w.timeSpentHours ? w.timeSpentHours * 60 : 0)), 0);
  const totalHours = minutesToHours(totalMinutes);
  const uniqueUsers = new Set(worklogs.map((w) => w.user?.id || w.userId)).size;

  if (loading) {
    return (
      <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
        <Spinner centered label="스프린트 작업 일지를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Summary KPI Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}
      >
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 'var(--radius-xs)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Clock size={20} color="#3b82f6" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>스프린트 누적 투입 시간</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)' }}>
              {totalHours}h <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>({totalMinutes}분)</span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-xs)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <UserCheck size={20} color="#10b981" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>작업 기록 참여 인원</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)' }}>
              {uniqueUsers}명
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: 'var(--radius-xs)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Calendar size={20} color="#a855f7" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>총 작업 기록 건수</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)' }}>
              {worklogs.length}건
            </div>
          </div>
        </div>
      </div>

      {/* Top Header & Refresh */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          작업 타임라인 피드
        </span>
        <Button size="sm" variant="ghost" icon={<RefreshCw size={13} />} onClick={fetchWorklogs}>
          새로고침
        </Button>
      </div>

      {/* Worklog List */}
      {worklogs.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-xs)',
            border: '1px dashed var(--border-light)',
            color: 'var(--text-muted)',
          }}
        >
          <Clock size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '4px' }}>
            기록된 작업 일지가 없습니다.
          </div>
          <div style={{ fontSize: '0.75rem' }}>
            {sprintIssuesCount > 0
              ? '개별 이슈 상세 화면에서 실제 작업 시간을 기록하면 스프린트 작업 타임라인에 실시간 반영됩니다.'
              : '먼저 스프린트에 이슈를 할당해 주세요.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {worklogs.map((w) => {
            const author = w.user;
            const issue = w.issue;
            const hours = w.timeSpentHours || (w.timeSpent ? (w.timeSpent / 60).toFixed(1) : 0);

            return (
              <div
                key={w.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <Avatar user={author || undefined} name={author?.name} size={28} shape="circle" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                        {author?.name || author?.email || '익명'}
                      </span>
                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        ⏱️ {hours}시간 투입
                      </span>
                    </div>

                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {formatDateOnly(w.startedAt || w.createdAt)} ({formatTimeAgo(w.createdAt)})
                    </span>
                  </div>

                  {/* Target Issue */}
                  {issue && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        cursor: onOpenIssueDetail ? 'pointer' : 'default',
                      }}
                      onClick={() => onOpenIssueDetail && onOpenIssueDetail(issue.id)}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        #{issue.issueNumber || issue.id}
                      </span>
                      <span style={{ color: 'var(--text-main)' }}>{issue.title}</span>
                      {issue.status && <StatusBadge status={issue.status as any} size="sm" />}
                      {onOpenIssueDetail && <ExternalLink size={10} />}
                    </div>
                  )}

                  {/* Description */}
                  {w.description && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-main)',
                        background: 'rgba(0, 0, 0, 0.15)',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        lineHeight: 1.4,
                      }}
                    >
                      {w.description}
                    </div>
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