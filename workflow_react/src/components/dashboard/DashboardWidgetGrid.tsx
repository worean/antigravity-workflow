import React from 'react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { getWidgetDefinition } from './widgetRegistry';
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

  const sortedWidgets = [...widgets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const renderWidgetContent = (widget: (typeof widgets)[0]) => {
    const widgetDef = getWidgetDefinition(widget.type);
    if (!widgetDef) {
      return (
        <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          등록되지 않은 위젯 타입입니다 ({widget.type})
        </div>
      );
    }

    const WidgetComponent = widgetDef.Component;
    return (
      <WidgetComponent
        id={widget.id}
        title={widget.title}
        config={widget.config}
        onSelectIssue={onSelectIssue}
        onNavigate={onNavigate}
        onOpenAuth={onOpenAuth}
        onOpenConfig={widgetDef.ConfigModal ? () => openWidgetConfigModal(widget.id) : undefined}
      />
    );
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
        const widgetDef = getWidgetDefinition(widget.type);
        const canConfigure = Boolean(widgetDef?.ConfigModal);

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
