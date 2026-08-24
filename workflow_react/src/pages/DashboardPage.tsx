import React, { useState, useEffect } from 'react';
import type { Project, Issue } from '../types';
import { getProjects, getIssues } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, CheckSquare, Clock, CheckCircle2, ArrowUpRight, Plus, RefreshCw, Terminal } from 'lucide-react';
import {
  Button,
  Spinner,
  CountBadge,
  StatusBadge,
  ProjectBadge,
  Avatar,
} from '../components/common';
import { formatDateOnly } from '../utils/dateUtils';
import { parseStatusCategory } from '../utils/statusUtils';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
  onOpenCreateIssue: () => void;
  onOpenCreateProject: () => void;
  onSelectIssue?: (issue: Issue) => void;
  refreshKey?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenCreateIssue,
  onOpenCreateProject,
  onSelectIssue,
  refreshKey,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([getProjects(), getIssues()]);
      setProjects(pRes);
      setIssues(iRes);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const inProgressCount = issues.filter((i) => {
    const cat = parseStatusCategory(i.statusId || i.status);
    return cat === 'IN_PROGRESS';
  }).length;

  const inReviewCount = issues.filter((i) => {
    const cat = parseStatusCategory(i.statusId || i.status);
    return cat === 'IN_REVIEW';
  }).length;

  const doneCount = issues.filter((i) => {
    const cat = parseStatusCategory(i.statusId || i.status);
    return cat === 'DONE';
  }).length;

  const myAssignedIssues = issues.filter((i) => i.assigneeId === user?.id || i.assignee?.id === user?.id);

  const handleIssueClick = (issue: Issue) => {
    if (onSelectIssue) {
      onSelectIssue(issue);
    } else {
      onNavigate('issues');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Top Compact Summary Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            워크스페이스 요약 대시보드
          </span>
          {user && <Avatar user={user} size={18} shape="rounded" showBorder={false} />}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ({user ? `${user.name || user.email} 로그인 중` : '게스트 모드'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />} onClick={fetchData}>
            새로고침
          </Button>
          {isAuthenticated && (
            <>
              <Button variant="secondary" size="sm" icon={<Plus size={12} />} onClick={onOpenCreateProject}>
                프로젝트 추가
              </Button>
              <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={onOpenCreateIssue}>
                이슈 생성
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Overview Stats Cards Grid (Dense) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '8px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>총 프로젝트</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-bright)', marginTop: '2px' }}>
              {projects.length}
            </div>
          </div>
          <FolderKanban size={18} color="#9cdcfe" />
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>전체 이슈</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-bright)', marginTop: '2px' }}>
              {issues.length}
            </div>
          </div>
          <CheckSquare size={18} color="var(--primary)" />
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>진행 / 검토 중</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#cca700', marginTop: '2px' }}>
              {inProgressCount + inReviewCount}
            </div>
          </div>
          <Clock size={18} color="#cca700" />
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>완료된 작업</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ec9b0', marginTop: '2px' }}>
              {doneCount}
            </div>
          </div>
          <CheckCircle2 size={18} color="#4ec9b0" />
        </div>
      </div>

      {/* Main Grid Content (2-Column Compact Panels) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
        {/* Recent Issues List Card */}
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
            {loading ? (
              <Spinner centered label="불러오는 중..." />
            ) : issues.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center', fontSize: '0.78rem' }}>
                등록된 이슈가 없습니다.
              </div>
            ) : (
              issues.slice(0, 6).map((issue) => (
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
                    <span style={{ fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                      #{issue.id}
                    </span>
                    <span style={{ color: 'var(--text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                      {issue.title}
                    </span>
                    <ProjectBadge project={issue.project} projectId={issue.projectId} size="sm" />
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

        {/* My Assigned Tasks Card */}
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
              내 담당 작업 (My Tasks)
            </span>
            <CountBadge count={myAssignedIssues.length} variant="primary" size="sm" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!isAuthenticated ? (
              <div style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center', fontSize: '0.78rem' }}>
                로그인 후 담당 작업을 확인하실 수 있습니다.
              </div>
            ) : myAssignedIssues.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center', fontSize: '0.78rem' }}>
                현재 배정된 작업이 없습니다.
              </div>
            ) : (
              myAssignedIssues.slice(0, 6).map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => handleIssueClick(issue)}
                  className="glass-panel glass-panel-hover"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
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
                    <span style={{ fontWeight: 600, color: 'var(--text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                      #{issue.id} {issue.title}
                    </span>
                    <ProjectBadge project={issue.project} projectId={issue.projectId} size="sm" />
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
    </div>
  );
};
