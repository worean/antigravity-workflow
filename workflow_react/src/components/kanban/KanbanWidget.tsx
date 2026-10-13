import React, { useState, useMemo } from 'react';
import { useIssues, useUpdateIssue } from '@/api/issues';
import { STATUS_LIST, parseStatusCategory } from '@/utils/statusUtils';
import { KanbanWidgetCard } from './KanbanWidgetCard';
import { Spinner } from '@/components/common';
import { Filter, Kanban as KanbanIcon } from 'lucide-react';
import type { Issue } from '@/types';
import type {
  WidgetProps,
  Widgetable,
  KanbanWidgetFilterConfig,
} from '@/types/widget';
import { KanbanWidgetConfigModal } from './KanbanWidgetConfigModal';

import { useInvolvedProjects } from '@/hooks/useInvolvedProjects';
import { filterUserInvolvedIssues } from '@/utils/issueFilters';

export const KanbanWidget: React.FC<WidgetProps<KanbanWidgetFilterConfig>> = ({
  config = {},
  onSelectIssue,
  onOpenConfig,
}) => {
  const updateIssueMutation = useUpdateIssue();
  const { myProjectIds, user } = useInvolvedProjects();

  const projectId = config.projectId === 'ALL' ? undefined : config.projectId;
  const assigneeId = config.assigneeFilter === 'MY' ? 'my' : undefined;

  const { data: allIssues = [], isLoading } = useIssues(
    {
      projectId: projectId || undefined,
      assigneeId,
      onlyInvolved: true,
      all: true,
    },
    { enabled: true }
  );

  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // 1. Filter status columns based on widget config
  const activeColumns = useMemo(() => {
    const categories = config.statusCategories || ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    if (categories.length === 0) return [];
    return STATUS_LIST.filter((st) => categories.includes(st.key));
  }, [config.statusCategories]);

  // 2. ⭐️ 현재 자신이 속한 프로젝트 또는 담당/보고한 일감만 필터링 후 typeIds 필터링
  const filteredIssues = useMemo(() => {
    let result = filterUserInvolvedIssues(allIssues, user, myProjectIds);
    if (config.typeIds && config.typeIds.length > 0) {
      result = result.filter((i) => {
        const tId = i.typeId || (i.type && typeof i.type === 'object' ? i.type.id : i.type);
        return config.typeIds?.includes(Number(tId));
      });
    }
    return result;
  }, [allIssues, user, myProjectIds, config.typeIds]);

  // 3. Group issues by column
  const issuesByColumn = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    activeColumns.forEach((col) => {
      map[col.key] = [];
    });

    filteredIssues.forEach((issue) => {
      const cat = parseStatusCategory(issue.statusId || issue.status);
      if (map[cat]) {
        map[cat].push(issue);
      }
    });

    return map;
  }, [filteredIssues, activeColumns]);

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    setDraggedIssue(issue);
    e.dataTransfer.setData('text/plain', String(issue.id));
  };

  const handleDragEnd = () => {
    setDraggedIssue(null);
    setDragOverColumn(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    if (dragOverColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedIssue) return;

    const currentCat = parseStatusCategory(draggedIssue.statusId || draggedIssue.status);
    if (currentCat === targetColumnKey) return;

    const targetStatus = STATUS_LIST.find((s) => s.key === targetColumnKey);
    if (!targetStatus) return;

    try {
      await updateIssueMutation.mutateAsync({
        id: draggedIssue.id,
        data: { statusId: targetStatus.id },
      });
    } catch (err) {
      console.error('Failed to update issue status via KanbanWidget:', err);
    } finally {
      setDraggedIssue(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px' }}>
        <Spinner centered label="칸반 보드 데이터를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '220px',
        overflow: 'hidden',
      }}
    >
      {/* Mini Active Filter Summary Subheader */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-xs)',
          marginBottom: '8px',
          fontSize: '0.72rem',
          color: 'var(--text-sub)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Filter size={12} color="var(--primary)" />
          <span>
            {config.projectId && config.projectId !== 'ALL' ? `프로젝트 #${config.projectId}` : '전체 프로젝트'}
            {' · '}
            {config.assigneeFilter === 'MY' ? '내 일감만' : '모든 담당자'}
            {config.typeIds && config.typeIds.length > 0 ? ` · 유형 ${config.typeIds.length}개 선택됨` : ''}
          </span>
        </div>
        {onOpenConfig && (
          <button
            onClick={onOpenConfig}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            필터 변경
          </button>
        )}
      </div>

      {activeColumns.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          선택된 상태 컬럼이 없습니다. 필터 설정에서 컬럼을 활성화하세요.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${activeColumns.length}, minmax(180px, 1fr))`,
            gap: '8px',
            flex: 1,
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {activeColumns.map((col) => {
            const issuesInCol = issuesByColumn[col.key] || [];
            const isColumnHovered = dragOverColumn === col.key;

            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOverColumn(e, col.key)}
                onDragEnter={(e) => handleDragOverColumn(e, col.key)}
                onDragLeave={handleDragLeaveColumn}
                onDrop={(e) => handleDrop(e, col.key)}
                style={{
                  background: isColumnHovered ? 'var(--bg-card-hover)' : 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: isColumnHovered ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  boxShadow: isColumnHovered ? 'inset 0 0 0 1px var(--primary)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  minWidth: '180px',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '6px 8px',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: col.color || 'var(--primary)',
                      }}
                    />
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                      {col.koreanLabel}
                    </span>
                    {isColumnHovered && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--accent-cyan)',
                          background: 'rgba(0,122,204,0.2)',
                          padding: '1px 4px',
                          borderRadius: '2px',
                          fontWeight: 600,
                        }}
                      >
                        여기에 놓기
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '1px 5px',
                      borderRadius: '10px',
                    }}
                  >
                    {issuesInCol.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '380px',
                  }}
                >
                  {issuesInCol.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '24px 6px',
                        color: isColumnHovered ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        fontSize: '0.74rem',
                        border: isColumnHovered ? '1px dashed var(--primary)' : 'none',
                        borderRadius: 'var(--radius-xs)',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isColumnHovered ? '이곳으로 드롭하세요' : '일감 없음'}
                    </div>
                  ) : (
                    issuesInCol.map((iss) => (
                      <KanbanWidgetCard
                        key={iss.id}
                        issue={iss}
                        isDragging={draggedIssue?.id === iss.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onClick={onSelectIssue || (() => {})}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const kanbanWidgetDefinition: Widgetable<KanbanWidgetFilterConfig> = {
  type: 'kanban',
  title: '이슈 칸반 보드',
  description: '상태(Status) 및 일감 유형(Type)을 자유롭게 필터링하여 일감을 확인하고 드래그 앤 드롭으로 상태를 변경합니다.',
  defaultColSpan: 6,
  defaultHeight: 'normal',
  icon: <KanbanIcon size={22} color="var(--primary)" />,
  badge: '필터링 지원',
  Component: KanbanWidget,
  ConfigModal: KanbanWidgetConfigModal,
};
