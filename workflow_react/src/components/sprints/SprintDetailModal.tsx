// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import { Layers, MessageSquare, Clock, FileText, AlertCircle } from 'lucide-react';
import type { Sprint, Issue, User } from '@/types';
import { ModalWrapper, Button, StatusBadge } from '@/components/common';
import { formatDateOnly } from '@/utils/dateUtils';
import { SprintDiscussionsTab } from './SprintDiscussionsTab';
import { SprintWorklogsTab } from './SprintWorklogsTab';
import { SprintNotesTab } from './SprintNotesTab';

interface SprintDetailModalProps {
  sprint: Sprint | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isAuthenticated: boolean;
  projectIssues?: Issue[];
  onSprintUpdated?: () => void;
  onOpenIssueDetail?: (issueId: number) => void;
  onOpenManageIssuesModal?: (sprint: Sprint) => void;
  onOpenAuth?: () => void;
}

type SprintTabType = 'discussions' | 'worklogs' | 'notes' | 'issues';

export const SprintDetailModal: React.FC<SprintDetailModalProps> = ({
  sprint,
  isOpen,
  onClose,
  currentUser,
  isAuthenticated,
  onSprintUpdated,
  onOpenIssueDetail,
  onOpenManageIssuesModal,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<SprintTabType>('discussions');

  if (!isOpen || !sprint) return null;

  const sprintIssues = sprint.issues || [];
  const totalIssues = sprintIssues.length;
  const completedIssues = sprintIssues.filter(
    (i) => i.status?.category === 'DONE' || i.statusId === 3
  ).length;
  const progressPercent = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  const tabs: { id: SprintTabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'discussions', label: '실시간 논의 피드', icon: <MessageSquare size={14} /> },
    { id: 'worklogs', label: '작업 일지 타임라인', icon: <Clock size={14} /> },
    { id: 'notes', label: '스프린트 회의록 & 메모', icon: <FileText size={14} /> },
    { id: 'issues', label: '할당된 이슈 목록', icon: <Layers size={14} />, count: totalIssues },
  ];

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="850px" title={`🚀 ${sprint.name} - 협업 허브`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '80vh', overflow: 'hidden' }}>
        {/* Sprint Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(30, 31, 34, 0.6) 100%)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                  {sprint.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  기간: {formatDateOnly(sprint.startDate) || '미정'} ~ {formatDateOnly(sprint.endDate) || '미정'}
                  {sprint.project && ` • 프로젝트: ${sprint.project.name} (${sprint.project.key})`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background:
                    sprint.status === 'ACTIVE'
                      ? 'rgba(59, 130, 246, 0.2)'
                      : sprint.status === 'COMPLETED'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(148, 163, 184, 0.2)',
                  color:
                    sprint.status === 'ACTIVE'
                      ? '#60a5fa'
                      : sprint.status === 'COMPLETED'
                      ? '#34d399'
                      : '#94a3b8',
                }}
              >
                {sprint.status === 'ACTIVE' ? '진행 중' : sprint.status === 'COMPLETED' ? '완료됨' : '계획됨'}
              </span>
            </div>
          </div>

          {/* Goal & Progress */}
          {sprint.goal && (
            <div
              style={{
                fontSize: '0.76rem',
                color: 'var(--text-main)',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '6px 10px',
                borderRadius: '4px',
              }}
            >
              🎯 <strong>스프린트 목표:</strong> {sprint.goal}
            </div>
          )}

          {/* Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
              <span>이슈 진척도 ({completedIssues}/{totalIssues}개 완료)</span>
              <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{progressPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '5px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: progressPercent === 100 ? '#10b981' : 'var(--primary)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* 4-Tab Navigation Bar */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '2px',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-xs) var(--radius-xs) 0 0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: '0.66rem',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Container */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px', paddingBottom: '10px' }}>
          {/* 1. Discussions Stream */}
          {activeTab === 'discussions' && (
            <SprintDiscussionsTab
              sprintId={sprint.id}
              sprintIssuesCount={totalIssues}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
              onOpenIssueDetail={onOpenIssueDetail}
              onOpenAuth={onOpenAuth}
            />
          )}

          {/* 2. Worklogs Timeline */}
          {activeTab === 'worklogs' && (
            <SprintWorklogsTab
              sprintId={sprint.id}
              sprintIssuesCount={totalIssues}
              onOpenIssueDetail={onOpenIssueDetail}
            />
          )}

          {/* 3. Notes & Standup Memo */}
          {activeTab === 'notes' && (
            <SprintNotesTab
              sprint={sprint}
              isAuthenticated={isAuthenticated}
              onSprintUpdated={onSprintUpdated}
              onOpenAuth={onOpenAuth}
            />
          )}

          {/* 4. Assigned Issues List */}
          {activeTab === 'issues' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                  스프린트 할당 이슈 ({sprintIssues.length}개)
                </span>
                {onOpenManageIssuesModal && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      onClose();
                      onOpenManageIssuesModal(sprint);
                    }}
                  >
                    이슈 할당/해제 관리
                  </Button>
                )}
              </div>

              {sprintIssues.length === 0 ? (
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
                  <AlertCircle size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                    할당된 이슈가 없습니다.
                  </div>
                  {onOpenManageIssuesModal && (
                    <Button
                      size="sm"
                      variant="primary"
                      style={{ marginTop: '8px' }}
                      onClick={() => {
                        onClose();
                        onOpenManageIssuesModal(sprint);
                      }}
                    >
                      백로그에서 이슈 가져오기
                    </Button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sprintIssues.map((iss) => (
                    <div
                      key={iss.id}
                      onClick={() => onOpenIssueDetail && onOpenIssueDetail(iss.id)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: onOpenIssueDetail ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>
                          #{iss.issueNumber || iss.id}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-bright)' }}>
                          {iss.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {iss.assignee && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {iss.assignee.name}
                          </span>
                        )}
                        {iss.status && <StatusBadge status={iss.status as any} size="sm" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};