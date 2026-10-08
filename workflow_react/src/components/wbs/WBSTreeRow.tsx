import React from 'react';
import type { Issue } from '@/types';
import type { WBSItem, TreeDropTarget } from '@/types/wbs';
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  Plus,
} from 'lucide-react';
import { StatusBadge, Avatar } from '@/components/common';
import { MemoIndicator } from '@/components/memos';

interface WBSTreeRowProps {
  item: WBSItem;
  isCollapsed: boolean;
  isBeingDragged: boolean;
  isTarget: boolean;
  treeDropTarget: TreeDropTarget | null;
  updatingIssueId: number | null;
  onToggleCollapse: (issueId: number) => void;
  onSelectIssue?: (issue: Issue) => void;
  onAddSubIssue?: (parentIssue: Issue) => void;
  onDragStart: (e: React.DragEvent, issueId: number) => void;
  onDragOver: (e: React.DragEvent, issue: Issue) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetIssue: Issue | 'root') => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const WBSTreeRow: React.FC<WBSTreeRowProps> = ({
  item,
  isCollapsed,
  isBeingDragged,
  isTarget,
  treeDropTarget,
  updatingIssueId,
  onToggleCollapse,
  onSelectIssue,
  onAddSubIssue,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const iss = item.issue;

  let rowBg = item.isParent ? 'rgba(255,255,255,0.03)' : 'transparent';
  let rowBoxShadow: string | undefined = undefined;
  let rowBorderTop: string | undefined = undefined;
  let rowBorderBottom = '1px solid var(--border-divider)';

  if (isTarget) {
    if (treeDropTarget?.position === 'inside') {
      rowBg = 'var(--primary-subtle)';
      rowBoxShadow = 'inset 0 0 0 2px var(--primary)';
    } else if (treeDropTarget?.position === 'before') {
      rowBorderTop = '2.5px solid var(--accent-cyan)';
    } else if (treeDropTarget?.position === 'after') {
      rowBorderBottom = '2.5px solid var(--accent-cyan)';
    }
  }

  const mouseDownPosRef = React.useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      key={iss.id}
      className="wbs-tree-row"
      draggable={!updatingIssueId}
      onDragStart={(e) => onDragStart(e, iss.id)}
      onDragOver={(e) => onDragOver(e, iss)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, iss)}
      onDragEnd={onDragEnd}
      onMouseDown={(e) => {
        mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if (mouseDownPosRef.current) {
          const dist = Math.hypot(e.clientX - mouseDownPosRef.current.x, e.clientY - mouseDownPosRef.current.y);
          mouseDownPosRef.current = null;
          if (dist > 5) return;
        }
        if (onSelectIssue) onSelectIssue(iss);
      }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: rowBorderBottom,
        borderTop: rowBorderTop,
        fontSize: '0.74rem',
        padding: '0 8px',
        cursor: 'pointer',
        background: rowBg,
        boxShadow: rowBoxShadow,
        opacity: isBeingDragged ? 0.35 : 1,
        transition: 'background-color 0.15s ease, opacity 0.15s ease',
        boxSizing: 'border-box',
      }}
      title={
        isTarget && treeDropTarget?.position === 'inside'
          ? `"${iss.title}"의 하위 이슈로 배치`
          : isTarget && treeDropTarget?.position === 'before'
          ? `"${iss.title}"의 위쪽(동일 계층)으로 이동`
          : isTarget && treeDropTarget?.position === 'after'
          ? `"${iss.title}"의 아래쪽(동일 계층)으로 이동`
          : `#${iss.id} ${iss.title} - 클릭하여 상세 및 편집`
      }
    >
      {/* 개인 메모 인디케이터 (좌측 상단 붉은색 삼각형) */}
      <MemoIndicator issueId={iss.id} />

      {/* Drag Grip Handle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '14px',
          color: 'var(--text-muted)',
          cursor: 'grab',
          flexShrink: 0,
          opacity: 0.5,
        }}
        title="드래그하여 계층 구조를 변경합니다"
      >
        <GripVertical size={12} />
      </div>

      {/* Title with indent and collapse arrow */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectIssue) onSelectIssue(iss);
        }}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          paddingLeft: `${item.depth * 14}px`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
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
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
        ) : (
          <span style={{ width: '13px', display: 'inline-block' }} />
        )}

        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: item.color.border,
            display: 'inline-block',
            flexShrink: 0,
            marginRight: '3px',
            boxShadow: `0 0 4px ${item.color.border}88`,
          }}
          title={`루트 이슈 #${item.rootIssueId} 색상 그룹`}
        />

        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginRight: '2px' }}>
          #{iss.id}
        </span>
        <span
          style={{
            fontWeight: item.isParent ? 600 : 400,
            color: item.isParent ? 'var(--text-bright)' : 'var(--text-main)',
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
        <StatusBadge status={iss.status} size="sm" />
      </div>

      {/* Assignee */}
      <div style={{ width: '65px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
        {iss.assignee ? (
          <Avatar user={iss.assignee} name={iss.assignee.name || ''} size={16} shape="circle" />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>미지정</span>
        )}
      </div>

      {/* 🚀 하위 이슈 추가 (+) 액션 버튼 (맨 오른쪽에서 호버 시 부드러운 슬라이드로 등장) */}
      <div style={{ width: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
        <button
          type="button"
          className="wbs-add-subtask-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddSubIssue) onAddSubIssue(iss);
          }}
          title={`#${iss.id} "${iss.title}"에 하위 일감 추가`}
          aria-label={`#${iss.id} 하위 일감 추가`}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
};