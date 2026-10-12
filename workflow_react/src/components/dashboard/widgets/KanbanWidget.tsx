﻿import React, { useState, useMemo } from 'react';
import { useIssues, useUpdateIssue } from '@/api/issues';
import { useAuth } from '@/context/AuthContext';
import { STATUS_LIST, parseStatusCategory } from '@/utils/statusUtils';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import { Spinner } from '@/components/common';
import { Filter } from 'lucide-react';
import type { Issue } from '@/types';
import type { DashboardWidgetConfig } from '@/types/dashboard';

interface KanbanWidgetProps {
  config?: DashboardWidgetConfig;
  onSelectIssue?: (issue: Issue) => void;
  onOpenAuth?: () => void;
  onOpenConfig?: () => void;
}

export const KanbanWidget: React.FC<KanbanWidgetProps> = ({
  config = {},
  onSelectIssue,
  onOpenAuth,
  onOpenConfig,
}) => {
  const { user, isAuthenticated } = useAuth();
  const updateIssueMutation = useUpdateIssue();

  const projectId = config.projectId === 'ALL' ? undefined : config.projectId;
  const assigneeId = config.assigneeFilter === 'MY' ? 'my' : undefined;

  const { data: allIssues = [], isLoading } = useIssues(
    {
      projectId: projectId || undefined,
      assigneeId,
      all: true,
    },
    { enabled: true }
  );

  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null);

  // 1. Filter status columns based on widget config
  const activeColumns = useMemo(() => {
    const categories = config.statusCategories || ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    if (categories.length === 0) return [];
    return STATUS_LIST.filter((st) => categories.includes(st.key));
  }, [config.statusCategories]);

  // 2. Filter issues by typeIds
  const filteredIssues = useMemo(() => {
    let result = allIssues;
    if (config.typeIds && config.typeIds.length > 0) {
      result = result.filter((i) => {
        const tId = i.typeId || (i.type && typeof i.type === 'object' ? i.type.id : i.type);
        return config.typeIds?.includes(Number(tId));
      });
    }
    return result;
  }, [allIssues, config.typeIds]);

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
    e.dataTransfer.setData('text/plain', String(issue.id));
    setDraggedIssue(issue);
  };

  const handleDragEnd = () => {
    setDraggedIssue(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (!draggedIssue) return;

    const currentCat = parseStatusCategory(draggedIssue.statusId || draggedIssue.status);
    if (currentCat === targetCategory) return;

    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const colObj = STATUS_LIST.find((s) => s.key === targetCategory);
    if (!colObj) return;

    try {
      await updateIssueMutation.mutateAsync({
        id: draggedIssue.id,
        data: { statusId: colObj.id },
      });
    } catch (err) {
      console.error('Failed to move issue in widget:', err);
    } finally {
      setDraggedIssue(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px' }}>
        <Spinner centered label="칸반 데이터를 불러오는 중..." />
      </div>
    );
  }

  const isCustomFiltered =
    (config.statusCategories && config.statusCategories.length < 4) ||
    (config.typeIds && config.typeIds.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '220px', gap: '6px' }}>
      {/* Filter Status Summary Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 6px',
          fontSize: '0.7rem',
          color: 'var(--text-sub)',
          borderBottom: '1px solid var(--border-divider)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>
            총 <strong>{filteredIssues.length}</strong>개 일감
          </span>
          {isCustomFiltered && (
            <span
              style={{
                fontSize: '0.64rem',
                color: 'var(--primary)',
                background: 'rgba(0, 122, 204, 0.1)',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              필터 적용 중 (상태 {activeColumns.length}개
              {config.typeIds && config.typeIds.length > 0 ? `, 유형 ${config.typeIds.length}개` : ''})
            </span>
          )}
        </div>

        {onOpenConfig && (
          <button
            type="button"
            onClick={onOpenConfig}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.68rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Filter size={11} /> 필터 변경
          </button>
        )}
      </div>

      {activeColumns.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          <p style={{ fontSize: '0.82rem', marginBottom: '4px' }}>표시할 상태(Status)가 선택되지 않았습니다.</p>
          <span style={{ fontSize: '0.74rem' }}>우측 상단 필터 설정 아이콘을 눌러 표시할 상태를 선택하세요.</span>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${activeColumns.length}, minmax(180px, 1fr))`,
            gap: '8px',
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '2px',
          }}
        >
          {activeColumns.map((col) => {
            const issuesInCol = issuesByColumn[col.key] || [];
            return (
              <div
                key={col.key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.key)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '180px',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-light)',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                      {col.koreanLabel}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '0 5px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-sub)',
                      }}
                    >
                      {issuesInCol.length}
                    </span>
                  </div>
                </div>

                {/* Column Body: Cards List */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {issuesInCol.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 6px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      일감 없음
                    </div>
                  ) : (
                    issuesInCol.map((iss) => (
                      <KanbanCard
                        key={iss.id}
                        issue={iss}
                        columnKey={col.key}
                        isThisCardDragged={draggedIssue?.id === iss.id}
                        currentUser={user}
                        isAuthenticated={isAuthenticated}
                        handleDragStart={handleDragStart}
                        handleDragEnd={handleDragEnd}
                        handleStatusChange={async (_id, nextCat) => {
                          const nextCol = STATUS_LIST.find((s) => s.key === nextCat);
                          if (nextCol) {
                            await updateIssueMutation.mutateAsync({ id: iss.id, data: { statusId: nextCol.id } });
                          }
                        }}
                        handleOpenDeleteConfirm={() => {}}
                        handleToggleLike={async () => {}}
                        onSelectIssue={onSelectIssue || (() => {})}
                        onOpenAuth={onOpenAuth}
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
