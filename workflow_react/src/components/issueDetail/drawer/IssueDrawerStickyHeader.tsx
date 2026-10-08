﻿import React from 'react';
import { X } from 'lucide-react';
import type { Issue } from '@/types';

interface IssueDrawerStickyHeaderProps {
  issue: Issue | null;
  onClose: () => void;
}

export const IssueDrawerStickyHeader: React.FC<IssueDrawerStickyHeaderProps> = ({
  issue,
  onClose,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-header)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {issue?.project ? `${issue.project.name} (${issue.project.key})` : '이슈 상세 정보'}
        </span>
        {issue && (
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
            #{issue.issueNumber || issue.id}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onClose}
          style={{
            background: 'var(--bg-surface-hover, rgba(255, 255, 255, 0.06))',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
          }}
          title="닫기 (Esc)"
        >
          <X size={14} />
          <span>닫기 <kbd style={{ opacity: 0.6 }}>Esc</kbd></span>
        </button>
      </div>
    </div>
  );
};
