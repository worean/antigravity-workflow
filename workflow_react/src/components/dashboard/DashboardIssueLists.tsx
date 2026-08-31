// -*- coding: utf-8 -*-
import React from 'react';
import { Star, ArrowUpRight } from 'lucide-react';
import type { Issue } from '@/types';
import { Button, CountBadge, StatusBadge, ProjectBadge } from '@/components/common';
import { formatDateOnly } from '@/utils/dateUtils';

interface DashboardIssueListsProps {
  isAuthenticated: boolean;
  favoriteIssues: Issue[];
  recentIssues: Issue[];
  myAssignedIssues: Issue[];
  handleIssueClick: (issue: Issue) => void;
  onNavigate: (tab: any, projectId?: number | null) => void;
}

export const DashboardIssueLists: React.FC<DashboardIssueListsProps> = ({
  isAuthenticated,
  favoriteIssues,
  recentIssues,
  myAssignedIssues,
  handleIssueClick,
  onNavigate,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
      {/* 1. Starred / Favorite Issues Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          borderRadius: 'var(--radius-xs)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={14} fill="#eab308" color="#eab308" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              즐겨찾기 한 이슈 (Starred)
            </span>
          </div>
          <CountBadge count={favoriteIssues.length} variant="amber" size="sm" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {!isAuthenticated ? (
            <div style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center', fontSize: '0.78rem' }}>
              로그인 후 즐겨찾기한 이슈를 확인하실 수 있습니다.
            </div>
          ) : favoriteIssues.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center', fontSize: '0.78rem', lineHeight: '1.4' }}>
              ⭐ 즐겨찾기 등록된 이슈가 없습니다.<br />
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>이슈 목록이나 상세에서 별표(★)를 눌러 등록해보세요.</span>
            </div>
          ) : (
            favoriteIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => handleIssueClick(issue)}
                className="glass-panel glass-panel-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: '#2d2d2d',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s ease, border-color 0.1s ease',
                }}
                title="클릭하여 이슈 상세 및 수정 화면으로 이동"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <ProjectBadge project={issue.project} projectId={issue.projectId} size="sm" />
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {issue.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {issue.dueDate && (
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>
                      {formatDateOnly(issue.dueDate)}
                    </span>
                  )}
                  <StatusBadge status={issue.statusId || issue.status} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Recent Issues List Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            최근 등록된 이슈
          </span>
          <Button variant="secondary" size="sm" icon={<ArrowUpRight size={12} />} iconPosition="right" onClick={() => onNavigate('issues')}>
            전체 보기
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {recentIssues.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center', fontSize: '0.78rem' }}>
              등록된 이슈가 없습니다.
            </div>
          ) : (
            recentIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => handleIssueClick(issue)}
                className="glass-panel glass-panel-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: '#2d2d2d',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s ease, border-color 0.1s ease',
                }}
                title="클릭하여 이슈 상세 및 수정 화면으로 이동"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <ProjectBadge project={issue.project} projectId={issue.projectId} size="sm" />
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {issue.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {issue.dueDate && (
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>
                      {formatDateOnly(issue.dueDate)}
                    </span>
                  )}
                  <StatusBadge status={issue.statusId || issue.status} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. My Assigned Issues Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            내 담당 이슈
          </span>
          <CountBadge count={myAssignedIssues.length} variant="primary" size="sm" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {!isAuthenticated ? (
            <div style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center', fontSize: '0.78rem' }}>
              로그인 후 내 담당 이슈를 확인하실 수 있습니다.
            </div>
          ) : myAssignedIssues.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center', fontSize: '0.78rem' }}>
              배정된 이슈가 없습니다.
            </div>
          ) : (
            myAssignedIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => handleIssueClick(issue)}
                className="glass-panel glass-panel-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: '#2d2d2d',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s ease, border-color 0.1s ease',
                }}
                title="클릭하여 이슈 상세 및 수정 화면으로 이동"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <ProjectBadge project={issue.project} projectId={issue.projectId} size="sm" />
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {issue.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {issue.dueDate && (
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>
                      {formatDateOnly(issue.dueDate)}
                    </span>
                  )}
                  <StatusBadge status={issue.statusId || issue.status} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};