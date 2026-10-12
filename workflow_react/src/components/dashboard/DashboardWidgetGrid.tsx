﻿import React from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import {
  KanbanWidget,
  WBSGanttWidget,
  CalendarMiniWidget,
  StatCardsWidget,
  FocusSprintsWidget,
  RecentIssuesWidget,
  MemoWidget,
} from './widgets';
import type { Issue } from '@/types';

interface DashboardWidgetGridProps {
  onNavigate: (tab: any, projectId?: number | null) => void;
  onSelectIssue?: (issue: Issue) => void;
  onOpenAuth?: () => void;
}

export const DashboardWidgetGrid: React.FC<DashboardWidgetGridProps> = ({
  onNavigate,
  onSelectIssue,
  onOpenAuth,
}) => {
  const widgets = useDashboardStore((s) => s.widgets);
  const openWidgetConfigModal = useDashboardStore((s) => s.openWidgetConfigModal);

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  const renderWidgetContent = (widget: (typeof widgets)[0]) => {
    switch (widget.type) {
      case 'kanban':
        return (
          <KanbanWidget
            config={widget.config}
            onSelectIssue={onSelectIssue}
            onOpenAuth={onOpenAuth}
            onOpenConfig={() => openWidgetConfigModal(widget.id)}
          />
        );
      case 'wbs':
        return (
          <WBSGanttWidget
            config={widget.config}
            onSelectIssue={onSelectIssue}
          />
        );
      case 'calendar':
        return (
          <CalendarMiniWidget
            config={widget.config}
            onSelectIssue={onSelectIssue}
          />
        );
      case 'stats':
        return <StatCardsWidget />;
      case 'sprints':
        return (
          <FocusSprintsWidget
            onNavigate={onNavigate}
            onOpenAuth={onOpenAuth}
          />
        );
      case 'recent-issues':
        return (
          <RecentIssuesWidget
            onSelectIssue={onSelectIssue}
            onNavigate={onNavigate}
          />
        );
      case 'memo':
        return <MemoWidget />;
      default:
        return <div>알 수 없는 위젯입니다.</div>;
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '10px',
        width: '100%',
      }}
    >
      {sortedWidgets.map((widget) => {
        const canConfigure = widget.type === 'kanban';
        return (
          <DashboardWidgetCard
            key={widget.id}
            widget={widget}
            onOpenConfig={canConfigure ? () => openWidgetConfigModal(widget.id) : undefined}
          >
            {renderWidgetContent(widget)}
          </DashboardWidgetCard>
        );
      })}
    </div>
  );
};
