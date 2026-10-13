import React, { useState, useMemo } from 'react';
import {
  ListTodo,
  Clock,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';
import type { Issue } from '@/types';
import { useIssues } from '@/api/issues';
import { useWorklogs } from '@/api/worklogs';
import { ProjectTodoIssuesTab } from './ProjectTodoIssuesTab';
import { ProjectWorklogsTab } from './ProjectWorklogsTab';

interface ProjectIssuesOverviewWidgetProps {
  projectId: number;
  projectKey?: string;
  onSelectIssue?: (issue: Issue) => void;
  onGoToBoard?: (projectId: number) => void;
}

export const ProjectIssuesOverviewWidget: React.FC<ProjectIssuesOverviewWidgetProps> = ({
  projectId,
  onSelectIssue,
  onGoToBoard,
}) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'worklogs'>('issues');

  // 프로젝트 이슈 목록 조회
  const { data: issues = [], isLoading: isIssuesLoading } = useIssues({
    projectId,
    all: true,
  });

  // 프로젝트 작업로그 목록 조회
  const { data: worklogs = [], isLoading: isWorklogsLoading } = useWorklogs({
    projectId,
  });

  // 통계 메트릭 계산
  const metrics = useMemo(() => {
    let todoCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;

    issues.forEach((issue) => {
      const cat = issue.status?.category?.toUpperCase();
      if (cat === 'TODO') todoCount++;
      else if (cat === 'IN_PROGRESS') inProgressCount++;
      else if (cat === 'DONE') doneCount++;
    });

    const totalMinutes = worklogs.reduce((sum, log) => sum + (log.timeSpent || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;

    return {
      totalIssues: issues.length,
      todoCount,
      inProgressCount,
      doneCount,
      totalMinutes,
      totalHours,
      remainingMins,
    };
  }, [issues, worklogs]);

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* 1. Widget Header: Title + Quick Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'var(--primary-subtle)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart3 size={16} />
          </div>
          <div>
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-bright)',
                margin: 0,
              }}
            >
              이슈 진행 현황 & 작업 로그
            </h3>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              프로젝트 내 등록된 이슈의 실시간 상태 및 누적 작업 기록
            </span>
          </div>
        </div>

        {onGoToBoard && (
          <button
            type="button"
            onClick={() => onGoToBoard(projectId)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.background = 'var(--primary-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>칸반 보드로 이동</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* 2. Metrics Bar: Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '8px',
        }}
      >
        {/* Total Issues */}
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-light)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
            전체 이슈
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)' }}>
            {metrics.totalIssues}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '2px', color: 'var(--text-muted)' }}>건</span>
          </div>
        </div>

        {/* Todo */}
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-light)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <ListTodo size={11} color="var(--text-sub)" />
            <span>할 일 (TODO)</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-sub)' }}>
            {metrics.todoCount}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '2px', color: 'var(--text-muted)' }}>건</span>
          </div>
        </div>

        {/* In Progress */}
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-light)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <PlayCircle size={11} color="var(--primary)" />
            <span>진행 중</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
            {metrics.inProgressCount}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '2px', color: 'var(--text-muted)' }}>건</span>
          </div>
        </div>

        {/* Done */}
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-light)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <CheckCircle2 size={11} color="var(--success, #10b981)" />
            <span>완료</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success, #10b981)' }}>
            {metrics.doneCount}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '2px', color: 'var(--text-muted)' }}>건</span>
          </div>
        </div>

        {/* Total Worklog Time */}
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-light)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={11} color="var(--primary)" />
            <span>누적 작업 시간</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)' }}>
            {metrics.totalHours > 0 ? (
              <>
                {metrics.totalHours}
                <span style={{ fontSize: '0.72rem', fontWeight: 400, marginLeft: '1px', marginRight: '4px' }}>시간</span>
                {metrics.remainingMins > 0 && (
                  <>
                    {metrics.remainingMins}
                    <span style={{ fontSize: '0.72rem', fontWeight: 400, marginLeft: '1px' }}>분</span>
                  </>
                )}
              </>
            ) : (
              <>
                {metrics.remainingMins}
                <span style={{ fontSize: '0.72rem', fontWeight: 400, marginLeft: '1px' }}>분</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Sub-Tabs Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '8px',
          marginTop: '4px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            style={{
              background: activeTab === 'issues' ? 'var(--primary-subtle)' : 'transparent',
              color: activeTab === 'issues' ? 'var(--primary)' : 'var(--text-sub)',
              border: activeTab === 'issues' ? '1px solid var(--border-focus)' : '1px solid transparent',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ListTodo size={13} />
            <span>이슈 목록 ({metrics.todoCount + metrics.inProgressCount}건 진행중)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('worklogs')}
            style={{
              background: activeTab === 'worklogs' ? 'var(--primary-subtle)' : 'transparent',
              color: activeTab === 'worklogs' ? 'var(--primary)' : 'var(--text-sub)',
              border: activeTab === 'worklogs' ? '1px solid var(--border-focus)' : '1px solid transparent',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={13} />
            <span>작업 로그 ({worklogs.length}건)</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Content */}
      <div style={{ minHeight: '140px' }}>
        {activeTab === 'issues' ? (
          <ProjectTodoIssuesTab
            issues={issues}
            isLoading={isIssuesLoading}
            onSelectIssue={onSelectIssue}
            onGoToBoard={() => onGoToBoard && onGoToBoard(projectId)}
          />
        ) : (
          <ProjectWorklogsTab
            worklogs={worklogs}
            isLoading={isWorklogsLoading}
            onSelectIssue={onSelectIssue}
          />
        )}
      </div>
    </div>
  );
};
