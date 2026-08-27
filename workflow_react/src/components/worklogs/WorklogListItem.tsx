// -*- coding: utf-8 -*-
import React from 'react';
import { CheckSquare, Clock } from 'lucide-react';
import type { Worklog, User } from '../../types';
import { UserBadge } from '../common';
import { formatWorklogTime } from '../../utils/worklogUtils';

interface WorklogListItemProps {
  worklog: Worklog;
  currentUser: User | null;
}

export const WorklogListItem: React.FC<WorklogListItemProps> = ({ worklog, currentUser }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 'var(--radius-xs)',
        background: '#252526',
        border: '1px solid var(--border-light)',
        fontSize: '0.78rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
        <CheckSquare size={13} color="var(--primary)" />
        <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
          #{worklog.issueId} {worklog.issue?.title ? `- ${worklog.issue.title}` : ''}
        </span>
        <span style={{ color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
          {worklog.description ? `| ${worklog.description}` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--secondary)' }}>
          <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
          {formatWorklogTime(worklog.timeSpent)}
        </div>
        <UserBadge user={worklog.user} currentUserId={currentUser?.id} size="sm" />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {new Date(worklog.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>
    </div>
  );
};