// -*- coding: utf-8 -*-
import React from 'react';
import type { Issue } from '../../types';
import type { WBSItem, TreeDropTarget } from '../../types/wbs';
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { StatusBadge, Avatar } from '../common';

interface WBSTreeRowProps {
  item: WBSItem;
  isCollapsed: boolean;
  isBeingDragged: boolean;
  isTarget: boolean;
  treeDropTarget: TreeDropTarget | null;
  onToggleCollapse: (issueId: number) => void;
  onSelectIssue?: (issue: Issue) => void;
  onDragStart: (e: React.DragEvent, issueId: number) => void;
  onDragOver: (e: React.DragEvent, issueId: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetIssue: Issue | 'root') => void;
}

export const WBSTreeRow: React.FC<WBSTreeRowProps> = ({
  item,
  isCollapsed,
  isBeingDragged,
  isTarget,
  treeDropTarget,
  onToggleCollapse,
  onSelectIssue,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const iss = item.issue;

  let rowBg = item.isParent ? 'rgba(255,255,255,0.03)' : 'transparent';
  let rowBoxShadow: string | undefined = undefined;
  let rowBorderTop: string | undefined = undefined;
  let rowBorderBottom = '1px solid #333333';

  if (isTarget && treeDropTarget) {
    if (treeDropTarget.position === 'inside') {
      rowBg = 'rgba(0, 122, 204, 0.25)';
      rowBoxShadow = 'inset 0 0 0 1px #007acc';
    } else if (treeDropTarget.position === 'before') {
      rowBorderTop = '2px solid #007acc';
    } else if (treeDropTarget.position === 'after') {
      rowBorderBottom = '2px solid #007acc';
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, iss.id)}
      onDragOver={(e) => onDragOver(e, iss.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, iss)}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '38px',
        borderBottom: rowBorderBottom,
        borderTop: rowBorderTop,
        padding: '0 8px',
        fontSize: '0.75rem',
        background: rowBg,
        boxShadow: rowBoxShadow,
        opacity: isBeingDragged ? 0.35 : 1,
        transition: 'background 0.15s',
        cursor: 'default',
        position: 'relative',
        boxSizing: 'border-box',
      }}
      className="wbs-table-row"
    >
      {/* Title & Hierarchy Indent */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: `${item.depth * 16}px`,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          gap: '4px',
        }}
      >
        {/* Drag Handle */}
        <span
          style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', opacity: 0.6 }}
          title="끌어서 다른 작업의 상위/하위로 계층 이동"
        >
          <GripVertical size={13} />
        </span>

        {/* Collapse / Expand Toggle */}
        {item.hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(iss.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '2px',
            }}
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
        ) : (
          <span style={{ width: '17px', display: 'inline-block' }} />
        )}

        {/* Issue Icon / Color Marker */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: item.isParent ? '2px' : '50%',
            background: item.color.base,
            flexShrink: 0,
          }}
        />

        {/* Title Text */}
        <span
          onClick={() => onSelectIssue && onSelectIssue(iss)}
          style={{
            color: item.isParent ? 'var(--text-bright)' : 'var(--text-main)',
            fontWeight: item.isParent ? 600 : 400,
            cursor: onSelectIssue ? 'pointer' : 'default',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={iss.title}
        >
          {iss.title}
        </span>
      </div>

      {/* Status */}
      <div style={{ width: '70px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <StatusBadge status={iss.statusId || iss.status} size="sm" />
      </div>

      {/* Assignee */}
      <div style={{ width: '65px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        {iss.assignee ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={iss.assignee.name || iss.assignee.email}>
            <Avatar user={iss.assignee} size={18} shape="circle" />
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>-</span>
        )}
      </div>

      {/* Progress % */}
      <div style={{ width: '55px', textAlign: 'center', flexShrink: 0, color: 'var(--text-sub)', fontSize: '0.7rem' }}>
        {iss.progress !== undefined && iss.progress !== null ? `${iss.progress}%` : '0%'}
      </div>
    </div>
  );
};