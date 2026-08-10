import React, { useState, useEffect } from 'react';
import type { Project, Issue } from '../types';
import { getProjects, getIssues } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, CheckSquare, Clock, CheckCircle2, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
  onOpenCreateIssue: () => void;
  onOpenCreateProject: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenCreateIssue,
  onOpenCreateProject,
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
  }, []);

  const todoCount = issues.filter((i) => !i.status || i.status.category === 'TODO' || i.status.name === 'TODO').length;
  const inProgressCount = issues.filter((i) => i.status?.category === 'IN_PROGRESS' || i.status?.name === 'IN_PROGRESS').length;
  const doneCount = issues.filter((i) => i.status?.category === 'DONE' || i.status?.name === 'DONE').length;
  const myAssignedIssues = issues.filter((i) => i.assigneeId === user?.id || i.assignee?.id === user?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            환영합니다, {user ? user.name || user.email : 'GUEST'} 님! 👋
          </h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.92rem' }}>
            Workflow REST API 서버와 직접 연결된 실시간 프로젝트 & 이슈 트래킹 대시보드입니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} title="새로고침">
            <RefreshCw size={15} /> 새로고침
          </button>
          {isAuthenticated && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={onOpenCreateProject}>
                <Plus size={15} /> 프로젝트 추가
              </button>
              <button className="btn btn-primary btn-sm" onClick={onOpenCreateIssue}>
                <Plus size={15} /> 이슈 작성
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Stats Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: 600 }}>총 프로젝트</span>
            <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '8px' }}>
              <FolderKanban size={18} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{projects.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            등록된 워크스페이스 프로젝트
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: 600 }}>전체 이슈 (Tasks)</span>
            <div style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '8px' }}>
              <CheckSquare size={18} color="var(--accent-cyan)" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{issues.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            할 일: {todoCount}건 | 진행 중: {inProgressCount}건
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: 600 }}>진행 중 이슈</span>
            <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '8px' }}>
              <Clock size={18} color="var(--accent-amber)" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            현재 처리 작업 중
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: 600 }}>완료된 작업</span>
            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px' }}>
              <CheckCircle2 size={18} color="var(--secondary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)' }}>{doneCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            완료 처리된 이슈
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Recent Issues List */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>최근 등록된 이슈</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('issues')}>
              전체 보기 <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                로딩 중...
              </div>
            ) : issues.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                등록된 이슈가 없습니다. 상단에서 이슈를 작성해보세요.
              </div>
            ) : (
              issues.slice(0, 5).map((issue) => (
                <div
                  key={issue.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                        #{issue.id}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {issue.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {issue.project?.name || '기본 프로젝트'} • 담당자: {issue.assignee?.name || issue.assignee?.email || '미지정'}
                    </span>
                  </div>

                  <span
                    className={`badge ${
                      issue.status?.name === 'DONE'
                        ? 'badge-done'
                        : issue.status?.name === 'IN_PROGRESS'
                        ? 'badge-in-progress'
                        : 'badge-todo'
                    }`}
                  >
                    {issue.status?.name || 'TODO'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Assigned Tasks */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>내 담당 작업 (My Tasks)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ({myAssignedIssues.length}건)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!isAuthenticated ? (
              <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                로그인 후 담당 작업을 확인하실 수 있습니다.
              </div>
            ) : myAssignedIssues.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                현재 배정된 작업이 없습니다.
              </div>
            ) : (
              myAssignedIssues.map((issue) => (
                <div
                  key={issue.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{issue.title}</span>
                    <span className="badge badge-in-progress">{issue.status?.name || 'TODO'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    프로젝트: {issue.project?.name || issue.projectId}
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
