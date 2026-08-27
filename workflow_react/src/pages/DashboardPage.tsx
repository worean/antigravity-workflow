// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import type { Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects, useIssues, useFavorites, issueKeys, projectKeys, favoriteKeys } from '../api';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Terminal,
  LogIn,
  Star,
  Zap,
  Target,
  AlertTriangle,
  Users,
  Layers,
} from 'lucide-react';
import {
  Button,
  CountBadge,
  StatusBadge,
  ProjectBadge,
  Avatar,
  FavoriteButton,
} from '../components/common';
import { formatDateOnly, diffDays } from '../utils/dateUtils';
import { parseStatusCategory } from '../utils/statusUtils';

interface DashboardPageProps {
  onNavigate: (tab: any, projectId?: number | null) => void;
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

  const { data: myAssignedIssues = [] } = useIssues(
    { assigneeId: 'my', limit: 6, sortBy: 'updatedAt', order: 'desc' },
    { enabled: isAuthenticated }
  );

  const { data: favIssuesData = [] } = useFavorites('ISSUE', { enabled: isAuthenticated });
  const favoriteIssues: Issue[] = favIssuesData.map((f) => f.detail).filter(Boolean);

  const { data: favSprintsData = [] } = useFavorites('SPRINT', { enabled: isAuthenticated });
  const favoriteSprints: any[] = favSprintsData.map((f) => f.detail).filter(Boolean);

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
      onNavigate('issues', issue.projectId);
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

      {/* 4 Compact Stat Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
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

      {/* 🚀 ⭐ 즐겨찾기 스프린트 집중 분석 및 모니터링 섹션 (Starred Sprint Focus Monitor) */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(37, 37, 38, 0.9) 0%, rgba(30, 30, 30, 0.95) 100%)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: 'var(--radius-xs)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '4px',
                background: 'rgba(234, 179, 8, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={13} color="#eab308" />
            </div>
            <div>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-bright)', letterSpacing: '-0.2px' }}>
                집중 모니터링 스프린트 (Focus Sprints)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                즐겨찾기(★) 등록된 핵심 스프린트의 실시간 번다운 및 리스크 분석
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CountBadge count={favoriteSprints.length} variant="amber" size="sm" />
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowUpRight size={12} />}
              iconPosition="right"
              onClick={() => onNavigate('sprints')}
            >
              스프린트 전체
            </Button>
          </div>
        </div>

        {/* Sprint Cards Grid */}
        {favoriteSprints.length === 0 ? (
          <div
            style={{
              padding: '20px 16px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-xs)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <Zap size={24} color="#cca700" style={{ opacity: 0.6, margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              집중 모니터링할 스프린트를 등록해보세요!
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '420px', margin: '4px auto 10px' }}>
              스프린트 관리 페이지에서 주요 스프린트에 별표(★)를 누르면, 이곳에서 실시간 진척도, 남은 일정, 투입 인원 및 리스크 요소를 한눈에 집중 분석할 수 있습니다.
            </div>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('sprints')}>
              스프린트 목록 바로가기 →
            </Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
            {favoriteSprints.map((sprint) => {
              const issues: Issue[] = sprint.issues || [];
              const totalIssues = issues.length || sprint._count?.issues || 0;
              const doneIssues = issues.filter((i) => parseStatusCategory(i.statusId || i.status) === 'DONE').length;
              const inProgIssues = issues.filter((i) => {
                const cat = parseStatusCategory(i.statusId || i.status);
                return cat === 'IN_PROGRESS' || cat === 'IN_REVIEW';
              }).length;
              const todoIssues = totalIssues - doneIssues - inProgIssues;
              const completionRate = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

              const highRiskIssues = issues.filter((i) => {
                const cat = parseStatusCategory(i.statusId || i.status);
                const isUrgent = i.priorityId === 4 || i.priorityId === 5 || (i.priority as any)?.level === 'HIGH' || (i.priority as any)?.level === 'URGENT';
                return isUrgent && cat !== 'DONE';
              }).length;

              const assigneesMap = new Map<number, any>();
              issues.forEach((i) => {
                if (i.assignee) assigneesMap.set(i.assignee.id, i.assignee);
              });
              const assignees = Array.from(assigneesMap.values());

              let dDayText = '기간 미정';
              let dDayColor = '#9cdcfe';
              let dDayBg = 'rgba(0,122,204,0.15)';
              if (sprint.endDate) {
                const d = diffDays(new Date(sprint.endDate), new Date());
                if (d < 0) {
                  dDayText = `${Math.abs(d)}일 초과`;
                  dDayColor = '#f14c4c';
                  dDayBg = 'rgba(241,76,76,0.15)';
                } else if (d === 0) {
                  dDayText = 'D-Day (오늘 마감)';
                  dDayColor = '#cca700';
                  dDayBg = 'rgba(204,167,0,0.18)';
                } else {
                  dDayText = `D-${d}일 남음`;
                  dDayColor = '#9cdcfe';
                  dDayBg = 'rgba(0,122,204,0.15)';
                }
              }

              return (
                <div
                  key={sprint.id}
                  style={{
                    background: '#202022',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Gold Top Accent Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, #eab308, #ca8a04)',
                    }}
                  />

                  {/* Sprint Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                          {sprint.name}
                        </span>
                        <StatusBadge status={sprint.status} size="sm" />
                      </div>
                      <ProjectBadge project={sprint.project} projectId={sprint.projectId} size="sm" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FavoriteButton
                        targetType="SPRINT"
                        targetId={sprint.id}
                        isFavorite={true}
                        size="sm"
                        onOpenAuth={onOpenAuth}
                        onToggleSuccess={handleRefresh}
                      />
                    </div>
                  </div>

                  {/* Goal & Schedule */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem' }}>
                    {sprint.goal && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', color: 'var(--text-sub)' }}>
                        <Target size={12} color="#cca700" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ lineHeight: '1.3' }}>{sprint.goal}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>
                        {sprint.startDate ? formatDateOnly(sprint.startDate) : '시작일 미정'} ~ {sprint.endDate ? formatDateOnly(sprint.endDate) : '종료일 미정'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: dDayColor, background: dDayBg, padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                        {dDayText}
                      </span>
                    </div>
                  </div>

                  {/* Progress & Burn-down Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                        진척률: {completionRate}%
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        완료 {doneIssues} / 진행 {inProgIssues} / 대기 {todoIssues} (총 {totalIssues}개)
                      </span>
                    </div>

                    {/* Multi-segment Progress Bar */}
                    <div
                      style={{
                        height: '6px',
                        background: '#333333',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        display: 'flex',
                        width: '100%',
                      }}
                    >
                      {totalIssues > 0 ? (
                        <>
                          <div style={{ width: `${(doneIssues / totalIssues) * 100}%`, background: '#10b981', transition: 'width 0.3s' }} title={`완료: ${doneIssues}개`} />
                          <div style={{ width: `${(inProgIssues / totalIssues) * 100}%`, background: '#38bdf8', transition: 'width 0.3s' }} title={`진행 중: ${inProgIssues}개`} />
                          <div style={{ width: `${(todoIssues / totalIssues) * 100}%`, background: '#4b5563', transition: 'width 0.3s' }} title={`대기: ${todoIssues}개`} />
                        </>
                      ) : (
                        <div style={{ width: '100%', background: '#333333' }} />
                      )}
                    </div>
                  </div>

                  {/* Assignees & Risk Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                    {/* Assignee Avatar Stack */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={12} color="var(--text-muted)" />
                      {assignees.length === 0 ? (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>담당자 없음</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '2px' }}>
                          {assignees.slice(0, 4).map((u, idx) => (
                            <div key={u.id} style={{ marginLeft: idx > 0 ? '-6px' : '0', zIndex: 10 - idx }} title={u.name || u.email}>
                              <Avatar user={u} size={18} shape="circle" showBorder />
                            </div>
                          ))}
                          {assignees.length > 4 && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 600 }}>
                              +{assignees.length - 4}명
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Risk Indicator */}
                    <div>
                      {highRiskIssues > 0 ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                          }}
                          title="미완료된 긴급/높음 우선순위 일감"
                        >
                          <AlertTriangle size={11} /> 긴급 이슈 {highRiskIssues}개
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                          ✓ 위험 이슈 없음
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Quick Links */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('sprints', sprint.projectId)}
                      style={{ flex: 1, fontSize: '0.72rem', height: '26px' }}
                    >
                      <Zap size={11} style={{ marginRight: '3px' }} /> 스프린트
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('issues', sprint.projectId)}
                      style={{ flex: 1, fontSize: '0.72rem', height: '26px' }}
                    >
                      <CheckSquare size={11} style={{ marginRight: '3px' }} /> 칸반
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('wbs', sprint.projectId)}
                      style={{ flex: 1, fontSize: '0.72rem', height: '26px' }}
                    >
                      <Layers size={11} style={{ marginRight: '3px' }} /> WBS
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

        {/* My Assigned Issues Card */}
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
    </div>
  );
};