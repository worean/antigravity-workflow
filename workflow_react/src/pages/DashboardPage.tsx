import React, { useState } from 'react';
import type { Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects, useIssues, useFavorites, issueKeys, projectKeys, favoriteKeys } from '../api';
import { FolderKanban, CheckSquare, Clock, CheckCircle2, ArrowUpRight, Plus, RefreshCw, Terminal, LogIn, Star } from 'lucide-react';
import {
  Button,
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
  onOpenAuth?: () => void;
  refreshKey?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenCreateIssue,
  onOpenCreateProject,
  onSelectIssue,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 1. 일반 useQuery를 사용하여 비로그인(게스트) 시에도 에러 throw 없이 안전하게 기본값 처리
  const { data: projects = [] } = useProjects(
    { limit: 30, sortBy: 'updatedAt', order: 'desc' },
    { enabled: isAuthenticated }
  );

  const { data: recentIssues = [] } = useIssues(
    { limit: 6, sortBy: 'id', order: 'desc' },
    { enabled: isAuthenticated }
  );

  const { data: statsIssues = [] } = useIssues(
    { limit: 100, sortBy: 'id', order: 'desc' },
    { enabled: isAuthenticated }
  );

  // 내 담당 이슈는 로그인 여부에 따라 조건부 조회
  const { data: myAssignedIssues = [] } = useIssues(
    { assigneeId: 'my', limit: 6, sortBy: 'updatedAt', order: 'desc' },
    { enabled: isAuthenticated }
  );

  // 즐겨찾기 이슈 조회
  const { data: favIssuesData = [] } = useFavorites('ISSUE', { enabled: isAuthenticated });
  const favoriteIssues: Issue[] = favIssuesData.map((f) => f.detail).filter(Boolean);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: issueKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const inProgressCount = statsIssues.filter((i) => {
    const cat = parseStatusCategory(i.statusId || i.status);
    return cat === 'IN_PROGRESS';
  }).length;

  const inReviewCount = statsIssues.filter((i) => {
    const cat = parseStatusCategory(i.statusId || i.status);
    return cat === 'IN_REVIEW';
  }).length;

  const doneCount = statsIssues.filter((i) => {
    const cat = parseStatusCategory(i.statusId || i.status);
    return cat === 'DONE';
  }).length;

  const handleIssueClick = (issue: Issue) => {
    if (onSelectIssue) {
      onSelectIssue(issue);
    } else {
      onNavigate('issues');
    }
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      className={`animate-fade-in ${isRefreshing ? 'transition-pending' : ''}`}
    >
      {/* Guest Mode Banner */}
      {!isAuthenticated && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.12))',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-xs)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-bright)' }}>
              👋 게스트 모드로 접속 중입니다
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              로그인하시면 프로젝트 생성, 일감 관리, 실시간 통계 및 실시간 채팅을 자유롭게 이용하실 수 있습니다.
            </div>
          </div>
          {onOpenAuth && (
            <Button variant="primary" size="sm" icon={<LogIn size={13} />} onClick={onOpenAuth}>
              로그인 / 회원가입
            </Button>
          )}
        </div>
      )}

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
          <Button variant="secondary" size="sm" icon={<RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />} onClick={handleRefresh}>
            새로고침
          </Button>
          {!isAuthenticated && onOpenAuth && (
            <Button variant="primary" size="sm" icon={<LogIn size={12} />} onClick={onOpenAuth}>
              로그인
            </Button>
          )}
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
              {statsIssues.length}
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

      {/* Main Grid Content (3-Column Compact Panels) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
        {/* ⭐ Starred / Favorite Issues Card */}
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
                  {DashboardIssueCard(issue)}
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
                  {DashboardIssueCard(issue)}
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
              myAssignedIssues.map((issue) => (
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
                  {DashboardIssueCard(issue)}
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
function DashboardIssueCard(issue: Issue) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
    <span style={{ fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
      #{issue.id}
    </span>
    <span style={{ color: 'var(--text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
      {issue.title}
    </span>
    <ProjectBadge project={issue.project} projectId={issue.projectId} size="sm" />
  </div>;
}


