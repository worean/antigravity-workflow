import React from 'react';
import type { Project } from '@/types';
import { Avatar, StatusBadge, PriorityBadge } from '@/components/common';
import { formatDateOnly, getDDayStatus } from '@/utils/dateUtils';

interface ProjectSidebarProps {
  project: Project;
  isEditing: boolean;
  editStatusId: number;
  setEditStatusId: (id: number) => void;
  editPriorityId: number;
  setEditPriorityId: (id: number) => void;
  editPlannedStartDate: string;
  setEditPlannedStartDate: (date: string) => void;
  editDueDate: string;
  setEditDueDate: (date: string) => void;
  editActualStartDate: string;
  setEditActualStartDate: (date: string) => void;
  editActualEndDate: string;
  setEditActualEndDate: (date: string) => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  project,
  isEditing,
  editStatusId,
  setEditStatusId,
  editPriorityId,
  setEditPriorityId,
  editPlannedStartDate,
  setEditPlannedStartDate,
  editDueDate,
  setEditDueDate,
  editActualStartDate,
  setEditActualStartDate,
  editActualEndDate,
  setEditActualEndDate,
}) => {
  const dDay = getDDayStatus(project.dueDate);

  return (
    <div
      style={{
        width: '320px',
        minWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
      }}
    >
      {/* Metadata Card */}
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
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-bright)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
          프로젝트 정보
        </div>

        {/* Owner */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>프로젝트 소유자 (Owner / PM)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar user={project.owner} name={project.owner?.name || ''} size={22} shape="circle" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-bright)', fontWeight: 500 }}>
              {project.owner?.name || '미지정'}
            </span>
          </div>
        </div>

        {/* Status & Priority */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>상태</div>
            {isEditing ? (
              <select
                className="input-field"
                value={editStatusId}
                onChange={(e) => setEditStatusId(Number(e.target.value))}
                style={{ width: '100%', height: '26px', fontSize: '0.75rem' }}
              >
                <option value={1}>준비 / 대기 (TODO)</option>
                <option value={2}>진행 중 (IN_PROGRESS)</option>
                <option value={3}>완료 (DONE)</option>
              </select>
            ) : (
              <StatusBadge status={project.status} size="md" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>우선순위</div>
            {isEditing ? (
              <select
                className="input-field"
                value={editPriorityId}
                onChange={(e) => setEditPriorityId(Number(e.target.value))}
                style={{ width: '100%', height: '26px', fontSize: '0.75rem' }}
              >
                <option value={1}>낮음 (Low)</option>
                <option value={2}>보통 (Medium)</option>
                <option value={3}>높음 (High)</option>
                <option value={4}>긴급 (Critical)</option>
              </select>
            ) : (
              <PriorityBadge priority={project.priority} size="md" />
            )}
          </div>
        </div>

        {/* Dates Section */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)' }}>
            일정 및 기한 관리
          </div>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  시작 계획일
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={editPlannedStartDate}
                  onChange={(e) => setEditPlannedStartDate(e.target.value)}
                  style={{ width: '100%', fontSize: '0.75rem', height: '26px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  완료 기한일
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  style={{ width: '100%', fontSize: '0.75rem', height: '26px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  실제 시작일
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={editActualStartDate}
                  onChange={(e) => setEditActualStartDate(e.target.value)}
                  style={{ width: '100%', fontSize: '0.75rem', height: '26px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  실제 종료일
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={editActualEndDate}
                  onChange={(e) => setEditActualEndDate(e.target.value)}
                  style={{ width: '100%', fontSize: '0.75rem', height: '26px' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>시작 계획:</span>
                <span style={{ color: 'var(--text-bright)' }}>{formatDateOnly(project.plannedStartDate) || '미설정'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>완료 기한:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: 'var(--text-bright)' }}>{formatDateOnly(project.dueDate) || '미설정'}</span>
                  {dDay && (
                    <span style={{ fontSize: '0.62rem', color: dDay.color, background: dDay.bg, padding: '1px 4px', borderRadius: '2px' }}>
                      {dDay.label}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>실제 기간:</span>
                <span style={{ color: 'var(--text-sub)' }}>
                  {formatDateOnly(project.actualStartDate) || '-'} ~ {formatDateOnly(project.actualEndDate) || '-'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Created / Updated timestamps */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <div>생성일: {formatDateOnly(project.createdAt)}</div>
          <div>최종 수정: {formatDateOnly(project.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
};