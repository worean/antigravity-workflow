import type React from 'react';
import type { Issue } from './';

export type DashboardWidgetType =
  | 'stats'
  | 'kanban'
  | 'calendar'
  | 'wbs'
  | 'sprints'
  | 'recent-issues'
  | 'memo';

export type DashboardWidgetHeight = 'compact' | 'normal' | 'tall';

export interface KanbanWidgetFilterConfig {
  statusCategories?: string[]; // e.g. ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
  typeIds?: number[];          // e.g. [1, 2, 3] (Task, Bug, Feature 등)
  projectId?: number | 'ALL';
  assigneeFilter?: 'ALL' | 'MY';
}

export interface WidgetConfig extends KanbanWidgetFilterConfig {
  [key: string]: any;
}

export type DashboardWidgetConfig = WidgetConfig;

export interface WidgetProps<TConfig = any> {
  id?: string;
  title?: string;
  config?: TConfig;
  onSelectIssue?: (issue: Issue) => void;
  onNavigate?: (tab: any, projectId?: number | null) => void;
  onOpenAuth?: () => void;
  onOpenConfig?: () => void;
}

export interface WidgetConfigModalProps<TConfig = any> {
  isOpen: boolean;
  onClose: () => void;
  config?: TConfig;
  onSave: (config: Partial<TConfig>) => void;
}

/**
 * 대시보드 위젯으로 탑재될 수 있는 컴포넌트 규격 인터페이스 (Widgetable)
 * 각 도메인 컴포넌트(Kanban, WBS, Calendar, Memo 등)는 이 인터페이스를 구현/제공하여
 * 대시보드에 독립적인 위젯으로 등록되고 동적으로 렌더링될 수 있습니다.
 */
export interface Widgetable<TConfig = any> {
  type: DashboardWidgetType;
  title: string;
  description: string;
  defaultColSpan: number; // 3 ~ 12
  defaultHeight: DashboardWidgetHeight; // 'compact' | 'normal' | 'tall'
  icon: React.ReactNode;
  badge?: string;
  Component: React.ComponentType<WidgetProps<TConfig>>;
  ConfigModal?: React.ComponentType<WidgetConfigModalProps<TConfig>>;
}
