// -*- coding: utf-8 -*-
import React from 'react';
import {
  Zap,
  Target,
  Calendar,
  Users,
  AlertTriangle,
  ArrowUpRight,
  CheckSquare,
  Layers,
} from 'lucide-react';
import type { Issue } from '@/types';
import { Button, CountBadge, StatusBadge, ProjectBadge, Avatar, FavoriteButton } from '@/components/common';
import { formatDateOnly } from '@/utils/dateUtils';
import { parseStatusCategory } from '@/utils/statusUtils';

interface DashboardFocusSprintsProps {
  favoriteSprints: any[];
  onNavigate: (tab: any, projectId?: number | null) => void;
  getSprintProgress: (sprint: any) => { total: number; done: number; inProgress: number; todo: number; rate: number };
  getDDayBadge: (sprint: any) => React.ReactNode;
  handleRefresh: () => Promise<void>;
  onOpenAuth?: () => void;
}

export const DashboardFocusSprints: React.FC<DashboardFocusSprintsProps> = ({
  favoriteSprints,
  onNavigate,
  getSprintProgress,
  getDDayBadge,
  handleRefresh,
  onOpenAuth,
}) => {
  return (
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
            const prog = getSprintProgress(sprint);
            const issues: Issue[] = sprint.issues || [];

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

                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'flex-start', gap: '5px', minHeight: '18px' }}>
                  <Target size={13} color="#cca700" style={{ marginTop: '1px', flexShrink: 0 }} />
                  <span style={{ lineHeight: '1.3' }}>{sprint.goal || '설정된 목표가 없습니다.'}</span>
                </div>

                {/* Dates & D-Day */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#1e1e1e',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.72rem',
                    color: 'var(--text-sub)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} color="var(--text-muted)" />
                    <span>
                      {formatDateOnly(sprint.startDate) || '시작일 미정'} ~ {formatDateOnly(sprint.endDate) || '기한 미정'}
                    </span>
                  </div>
                  {getDDayBadge(sprint)}
                </div>

                {/* Progress Bar & Issue Counts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>진척도 ({prog.rate}%)</span>
                    <span>완료 {prog.done} / 전체 {prog.total}개 이슈</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#333333', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${prog.rate}%`, background: '#89d185', transition: 'width 0.3s' }} />
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
  );
};