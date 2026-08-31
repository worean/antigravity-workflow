// -*- coding: utf-8 -*-
import React from 'react';
import {
  Zap,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';
import type { Sprint, Issue } from '@/types';
import { Button, Spinner, StatusBadge, Avatar } from '@/components/common';
import { formatDateOnly } from '@/utils/dateUtils';

interface SprintManageIssuesModalProps {
  showManageModal: boolean;
  setShowManageModal: (show: boolean) => void;
  managingSprint: Sprint | null;
  sprintIssues: Issue[];
  filteredBacklog: Issue[];
  manageLoading: boolean;
  autoCalculating: boolean;
  backlogSearch: string;
  setBacklogSearch: (search: string) => void;
  getDDayBadge: (sprint: Sprint) => React.ReactNode;
  handleSyncSprintDates: () => Promise<void>;
  handleRemoveIssueFromSprint: (issueId: number) => Promise<void>;
  handleAddIssueToSprint: (issueId: number) => Promise<void>;
}

export const SprintManageIssuesModal: React.FC<SprintManageIssuesModalProps> = ({
  showManageModal,
  setShowManageModal,
  managingSprint,
  sprintIssues,
  filteredBacklog,
  manageLoading,
  autoCalculating,
  backlogSearch,
  setBacklogSearch,
  getDDayBadge,
  handleSyncSprintDates,
  handleRemoveIssueFromSprint,
  handleAddIssueToSprint,
}) => {
  if (!showManageModal || !managingSprint) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={() => setShowManageModal(false)}
    >
      <div
        style={{
          background: '#1e1e1e',
          border: '1px solid #3c3c3c',
          borderRadius: 'var(--radius-sm)',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #333333',
            background: '#252526',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="#cca700" />
            <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-bright)' }}>
              [{managingSprint.name}] 이슈 할당 및 백로그 관리
            </span>
            <StatusBadge status={managingSprint.status} size="sm" />
          </div>
          <button
            onClick={() => setShowManageModal(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Date Sync Action Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            background: '#282828',
            borderBottom: '1px solid #333',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} color="var(--accent-cyan)" />
            <span>
              현재 기간: <strong>{formatDateOnly(managingSprint.startDate) || '시작일 미정'} ~ {formatDateOnly(managingSprint.endDate) || '기한 미정'}</strong>
            </span>
            {getDDayBadge(managingSprint)}
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles size={12} color="#cca700" />}
            onClick={handleSyncSprintDates}
            isLoading={autoCalculating}
            style={{ fontSize: '0.72rem', height: '24px' }}
            title="스프린트에 포함된 이슈들의 시작계획일 최솟값과 기한 최댓값으로 스프린트 기간을 자동 계산합니다."
          >
            이슈 일정 기반 시작일/기한 자동 동기화
          </Button>
        </div>

        {/* Modal Body: 2-Column Split View */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '12px 16px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Left Column: Assigned Issues */}
          <div
            style={{
              background: '#252526',
              border: '1px solid #383838',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              flexDirection: 'column',
              padding: '8px',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                스프린트 할당 이슈 ({sprintIssues.length})
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>스프린트 포함 목록</span>
            </div>

            {manageLoading ? (
              <Spinner centered size={16} />
            ) : sprintIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                현재 스프린트에 담긴 이슈가 없습니다.<br />우측 백로그에서 이슈를 추가해 보세요!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '380px' }}>
                {sprintIssues.map((iss) => (
                  <div
                    key={iss.id}
                    style={{
                      background: '#1e1e1e',
                      border: '1px solid #333',
                      borderRadius: 'var(--radius-xs)',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-bright)', lineHeight: '1.3' }}>
                        #{iss.id} {iss.title}
                      </span>
                      <button
                        onClick={() => handleRemoveIssueFromSprint(iss.id)}
                        style={{
                          background: 'rgba(241,76,76,0.15)',
                          border: '1px solid rgba(241,76,76,0.3)',
                          color: '#f14c4c',
                          fontSize: '0.65rem',
                          padding: '1px 5px',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        title="스프린트에서 제외하고 백로그로 이동"
                      >
                        제외
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <StatusBadge status={iss.status} size="sm" />
                        {iss.assignee && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-sub)' }}>
                            <Avatar user={iss.assignee} name={iss.assignee.name || ''} size={14} shape="circle" />
                            {iss.assignee.name || iss.assignee.email}
                          </span>
                        )}
                      </div>
                      {(iss.plannedStartDate || iss.dueDate) && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>
                          {formatDateOnly(iss.plannedStartDate) || '~'} ~ {formatDateOnly(iss.dueDate) || '~'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Project Backlog Pool */}
          <div
            style={{
              background: '#252526',
              border: '1px solid #383838',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              flexDirection: 'column',
              padding: '8px',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                프로젝트 미할당 백로그 ({filteredBacklog.length})
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>담을 수 있는 이슈</span>
            </div>

            <input
              type="text"
              className="input-field"
              placeholder="백로그 이슈 검색..."
              value={backlogSearch}
              onChange={(e) => setBacklogSearch(e.target.value)}
              style={{ fontSize: '0.72rem', height: '26px', padding: '0 6px' }}
            />

            {manageLoading ? (
              <Spinner centered size={16} />
            ) : filteredBacklog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                담을 수 있는 미할당 이슈가 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '340px' }}>
                {filteredBacklog.map((iss) => (
                  <div
                    key={iss.id}
                    style={{
                      background: '#1e1e1e',
                      border: '1px solid #333',
                      borderRadius: 'var(--radius-xs)',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-bright)', lineHeight: '1.3' }}>
                        #{iss.id} {iss.title}
                      </span>
                      <button
                        onClick={() => handleAddIssueToSprint(iss.id)}
                        style={{
                          background: 'rgba(0,122,204,0.2)',
                          border: '1px solid #007acc',
                          color: '#9cdcfe',
                          fontSize: '0.65rem',
                          padding: '1px 6px',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        title="이슈를 현재 스프린트에 할당"
                      >
                        + 담기
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <StatusBadge status={iss.status} size="sm" />
                        {iss.assignee && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-sub)' }}>
                            <Avatar user={iss.assignee} name={iss.assignee.name || ''} size={14} shape="circle" />
                            {iss.assignee.name || iss.assignee.email}
                          </span>
                        )}
                      </div>
                      {(iss.plannedStartDate || iss.dueDate) && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>
                          {formatDateOnly(iss.plannedStartDate) || '~'} ~ {formatDateOnly(iss.dueDate) || '~'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px', borderTop: '1px solid #333333', background: '#252526' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowManageModal(false)}
          >
            확인 및 닫기
          </Button>
        </div>
      </div>
    </div>
  );
};