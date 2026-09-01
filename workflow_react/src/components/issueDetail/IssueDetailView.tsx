import React from 'react';
import {
  Layers,
  User as UserIcon,
  Tag,
  GitBranch,
  CheckCircle2,
  Calendar,
  CornerDownRight,
  Plus,
  ChevronRight,
} from 'lucide-react';
import type { Issue, User } from '@/types';
import {
  StatusBadge,
  PriorityBadge,
  IssueTypeBadge,
  UserBadge,
  Avatar,
  MarkdownViewer,
  FavoriteButton,
  TagBadge,
} from '@/components/common';
import { getDDayStatus } from '@/utils/dateUtils';

interface IssueDetailViewProps {
  issue: Issue;
  user: User | null;
  isAuthenticated: boolean;
  plannedStartDate: string;
  dueDate: string;
  actualStartDate: string;
  actualEndDate: string;
  customFieldsData: Record<string, any>;
  setShowCreateSubTaskModal: (show: boolean) => void;
  setIssue: React.Dispatch<React.SetStateAction<Issue | null>>;
  onOpenAuth?: () => void;
}

export const IssueDetailView: React.FC<IssueDetailViewProps> = ({
  issue,
  user,
  isAuthenticated,
  plannedStartDate,
  dueDate,
  actualStartDate,
  actualEndDate,
  customFieldsData,
  setShowCreateSubTaskModal,
  setIssue,
  onOpenAuth,
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <FavoriteButton
          targetType="ISSUE"
          targetId={issue.id}
          isFavorite={issue.isFavorite}
          size="md"
          onOpenAuth={onOpenAuth}
          onToggleSuccess={(isFav) => {
            setIssue((prev) => (prev ? { ...prev, isFavorite: isFav } : prev));
          }}
        />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
          #{issue.id}
        </span>
        <IssueTypeBadge type={issue.typeId || issue.type} size="sm" />
        <StatusBadge status={issue.statusId || issue.status} size="sm" />
        <PriorityBadge priority={issue.priorityId || issue.priority} size="sm" />
      </div>

      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-bright)' }}>
        {issue.title}
      </h2>

      {/* 🏷️ Tags */}
      {Array.isArray(issue.tags) && issue.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
          {issue.tags.map((t) => (
            <TagBadge key={t.id || t.name} tag={t} size="sm" />
          ))}
        </div>
      )}

      {/* Main Metadata Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px', marginBottom: '10px' }}>
        <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            <Layers size={11} style={{ display: 'inline', marginRight: '3px' }} /> 프로젝트
          </span>
          <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.78rem' }}>
            {issue.project?.name || `#${issue.projectId}`} ({issue.project?.key})
          </span>
        </div>

        <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            <UserIcon size={11} style={{ display: 'inline', marginRight: '3px' }} /> 담당자
          </span>
          <UserBadge user={issue.assignee} currentUserId={user?.id} size="sm" />
        </div>

        <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            <UserIcon size={11} style={{ display: 'inline', marginRight: '3px' }} /> 작성자 (보고자)
          </span>
          <UserBadge user={issue.author} currentUserId={user?.id} size="sm" fallbackText="작성자 정보 없음" />
        </div>

        <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            <Tag size={11} style={{ display: 'inline', marginRight: '3px' }} /> 우선순위
          </span>
          <PriorityBadge priority={issue.priorityId || issue.priority} size="sm" />
        </div>

        <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            <GitBranch size={11} style={{ display: 'inline', marginRight: '3px' }} /> 상위 이슈
          </span>
          {issue.parent ? (
            <span
              onClick={() => {
                if (issue.parent?.id) {
                  window.location.hash = `#issue-detail?projectId=${issue.projectId}&issueId=${issue.parent.id}`;
                }
              }}
              style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              title="상위 이슈로 이동"
            >
              #{issue.parent.id} {issue.parent.title}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>최상위 일감</span>
          )}
        </div>

        <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            <CheckCircle2 size={11} style={{ display: 'inline', marginRight: '3px' }} /> 진척도
          </span>
          <span style={{ fontWeight: 600, color: '#4ec9b0', fontSize: '0.78rem' }}>{issue.progress || 0}%</span>
        </div>
      </div>

      {/* Schedule & Due Date Panel */}
      <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: '10px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} /> 일정 및 기한
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px', fontSize: '0.75rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>시작 계획일: </span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{plannedStartDate || '미설정'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>기한 (만료일): </span>
            <span style={{ fontWeight: 700, color: dueDate ? '#9cdcfe' : 'var(--text-sub)' }}>
              {dueDate || '미설정'}
            </span>
            {(() => {
              const dday = getDDayStatus(dueDate);
              if (!dday) return null;
              return (
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '2px',
                    color: dday.color,
                    background: dday.bg,
                  }}
                >
                  {dday.label}
                </span>
              );
            })()}
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>실제 시작일: </span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{actualStartDate || '미설정'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>실제 종료일: </span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{actualEndDate || '미설정'}</span>
          </div>
        </div>
      </div>

      {/* Detailed Description */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-sub)' }}>
          상세 내용
        </div>
        <MarkdownViewer content={issue.description} placeholder="등록된 상세 설명이 없습니다." />
      </div>

      {/* Sub-tasks / Children Section */}
      <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '10px 12px', borderRadius: 'var(--radius-xs)', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CornerDownRight size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              하위 이슈 (Sub-tasks)
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ({(issue.children || []).length}개)
            </span>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowCreateSubTaskModal(true)}
              style={{ fontSize: '0.7rem', height: '22px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="이 이슈를 상위 이슈로 하는 새로운 하위 이슈를 등록합니다."
            >
              <Plus size={11} /> 하위 이슈 추가
            </button>
          )}
        </div>

        {(!issue.children || issue.children.length === 0) ? (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
            등록된 하위 이슈가 없습니다. 상단의 <strong>[+ 하위 이슈 추가]</strong> 버튼을 눌러 하위 일감을 생성해 보세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {issue.children.map((sub: any) => (
              <div
                key={sub.id}
                onClick={() => {
                  window.location.hash = `#issue-detail?projectId=${issue.projectId}&issueId=${sub.id}`;
                }}
                style={{
                  background: '#252526',
                  border: '1px solid #383838',
                  borderRadius: '2px',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#323233')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#252526')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    #{sub.id}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-bright)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sub.title}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <StatusBadge status={sub.status} size="sm" />
                  <PriorityBadge priority={sub.priority} size="sm" />
                  {sub.assignee && (
                    <Avatar user={sub.assignee} name={sub.assignee.name || ''} size={16} shape="circle" />
                  )}
                  <ChevronRight size={12} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Fields Summary */}
      {Object.keys(customFieldsData).length > 0 && (
        <div style={{ background: '#2d2d2d', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: '10px', border: '1px solid #3c3c3c' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginBottom: '6px', fontWeight: 600 }}>
            ⚙️ 커스텀 필드
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
            {Object.entries(customFieldsData).map(([k, val]) => (
              <div key={k} style={{ background: '#252526', border: '1px solid #383838', padding: '4px 6px', borderRadius: '2px', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};