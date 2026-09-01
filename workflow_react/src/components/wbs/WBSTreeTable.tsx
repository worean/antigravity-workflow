import React, { useState, type RefObject } from 'react';
import type { Issue } from '@/types';
import type { WBSItem, TreeDropTarget } from '@/types/wbs';
import { WBSTreeRow } from './WBSTreeRow';
import { updateIssue } from '@/services/api';

interface WBSTreeTableProps {
  items: WBSItem[];
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  collapsedIds: Set<number>;
  onToggleCollapse: (issueId: number) => void;
  setCollapsedIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  onSelectIssue?: (issue: Issue) => void;
  tableBodyRef: RefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  leftWidth?: number;
  updatingIssueId: number | null;
  getDescendantIssueIds: (parentIssueId: number) => Set<number>;
  setUpdatingIssueId: (id: number | null) => void;
  setErrorMessage: (msg: string | null) => void;
  loadProjectData: () => Promise<void>;
}

export const WBSTreeTable: React.FC<WBSTreeTableProps> = ({
  items,
  issues,
  setIssues,
  collapsedIds,
  onToggleCollapse,
  setCollapsedIds,
  onSelectIssue,
  tableBodyRef,
  onScroll,
  leftWidth = 440,
  updatingIssueId,
  getDescendantIssueIds,
  setUpdatingIssueId,
  setErrorMessage,
  loadProjectData,
}) => {
  const [treeDragSourceId, setTreeDragSourceId] = useState<number | null>(null);
  const [treeDropTarget, setTreeDropTarget] = useState<TreeDropTarget | null>(null);

  const handleTreeDragStart = (e: React.DragEvent, issueId: number) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', String(issueId));
    e.dataTransfer.effectAllowed = 'move';
    setTreeDragSourceId(issueId);
  };

  const handleTreeDragOver = (e: React.DragEvent, targetIssue: Issue) => {
    e.preventDefault();
    e.stopPropagation();
    if (!treeDragSourceId || treeDragSourceId === targetIssue.id) return;

    const descendantIds = getDescendantIssueIds(treeDragSourceId);
    if (descendantIds.has(targetIssue.id)) return; // 순환 참조 방지

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    let position: 'inside' | 'before' | 'after' = 'inside';
    if (offsetY < height * 0.25) {
      position = 'before';
    } else if (offsetY > height * 0.75) {
      position = 'after';
    } else {
      position = 'inside';
    }

    e.dataTransfer.dropEffect = 'move';
    setTreeDropTarget({ targetId: targetIssue.id, position });
  };

  const handleTreeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTreeDragEnd = () => {
    setTreeDragSourceId(null);
    setTreeDropTarget(null);
  };

  const handleTreeDrop = async (e: React.DragEvent, targetIssue: Issue | 'root') => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = treeDragSourceId;
    const dropTarget = treeDropTarget;
    setTreeDragSourceId(null);
    setTreeDropTarget(null);

    if (!sourceId || !dropTarget) return;

    let newParentId: number | null = null;

    if (targetIssue === 'root' || dropTarget.position === 'root') {
      newParentId = null;
    } else if (typeof targetIssue === 'object') {
      if (sourceId === targetIssue.id) return;
      const descendantIds = getDescendantIssueIds(sourceId);
      if (descendantIds.has(targetIssue.id)) return;

      if (dropTarget.position === 'inside') {
        newParentId = targetIssue.id;
      } else {
        newParentId = targetIssue.parentId ? Number(targetIssue.parentId) : null;
      }
    }

    const draggedIssue = issues.find((i) => i.id === sourceId);
    if (!draggedIssue) return;
    const currentParentId = draggedIssue.parentId ? Number(draggedIssue.parentId) : null;

    if (currentParentId === newParentId) {
      return;
    }

    // 낙관적 UI 업데이트
    const previousIssues = [...issues];
    setIssues((prev) =>
      prev.map((iss) => (iss.id === sourceId ? { ...iss, parentId: newParentId } : iss))
    );

    if (newParentId) {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        next.delete(newParentId!);
        return next;
      });
    }

    setUpdatingIssueId(sourceId);
    try {
      await updateIssue(sourceId, { parentId: newParentId });
      await loadProjectData();
    } catch (err: any) {
      console.error('Failed to reparent issue in tree:', err);
      setIssues(previousIssues);
      setErrorMessage(err.response?.data?.error || '계층 구조 변경에 실패하여 원위치로 롤백합니다.');
      await loadProjectData();
    } finally {
      setUpdatingIssueId(null);
    }
  };

  return (
    <div
      style={{
        width: `${leftWidth}px`,
        minWidth: '320px',
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-light)',
        background: '#252526',
        flexShrink: 0,
      }}
    >
      {/* Left Header */}
      <div
        style={{
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-light)',
          background: '#1e1e1e',
          fontSize: '0.74rem',
          fontWeight: 600,
          color: 'var(--text-sub)',
          padding: '0 8px',
          userSelect: 'none',
        }}
      >
        <div style={{ flex: 1, paddingLeft: '4px' }}>작업명 / 이슈 제목 (WBS)</div>
        <div style={{ width: '70px', textAlign: 'center' }}>상태</div>
        <div style={{ width: '65px', textAlign: 'center' }}>담당자</div>
      </div>

      {/* Left Body */}
      <div
        ref={tableBodyRef}
        onScroll={onScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
        }}
      >
        {items.map((item) => {
          const iss = item.issue;
          const isCollapsed = collapsedIds.has(iss.id);
          const isBeingDragged = treeDragSourceId === iss.id;
          const isTarget = treeDropTarget?.targetId === iss.id;

          return (
            <WBSTreeRow
              key={iss.id}
              item={item}
              isCollapsed={isCollapsed}
              isBeingDragged={isBeingDragged}
              isTarget={isTarget}
              treeDropTarget={treeDropTarget}
              updatingIssueId={updatingIssueId}
              onToggleCollapse={onToggleCollapse}
              onSelectIssue={onSelectIssue}
              onDragStart={handleTreeDragStart}
              onDragOver={handleTreeDragOver}
              onDragLeave={handleTreeDragLeave}
              onDrop={handleTreeDrop}
              onDragEnd={handleTreeDragEnd}
            />
          );
        })}

        {/* Drop Target Zone: Move to Root (최상위 이슈로 빼기 영역) */}
        {treeDragSourceId && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
              setTreeDropTarget({ targetId: 'root', position: 'root' });
            }}
            onDragLeave={handleTreeDragLeave}
            onDrop={(e) => handleTreeDrop(e, 'root')}
            style={{
              margin: '8px',
              padding: '10px 8px',
              borderRadius: '4px',
              border: treeDropTarget?.targetId === 'root' ? '2px dashed #007acc' : '1px dashed #3e3e3e',
              background: treeDropTarget?.targetId === 'root' ? 'rgba(0, 122, 204, 0.2)' : 'rgba(255,255,255,0.02)',
              textAlign: 'center',
              fontSize: '0.72rem',
              color: treeDropTarget?.targetId === 'root' ? '#38bdf8' : 'var(--text-muted)',
              cursor: 'copy',
              transition: 'all 0.15s',
            }}
          >
            ➕ 여기에 놓으면 <strong>최상위(Root) 이슈</strong>로 변경됩니다
          </div>
        )}
      </div>
    </div>
  );
};