﻿﻿export type DashboardWidgetType =
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

export interface DashboardWidgetConfig extends KanbanWidgetFilterConfig {
  [key: string]: any;
}

export interface DashboardWidgetItem {
  id: string;
  type: DashboardWidgetType;
  title: string;
  colSpan: number; // 3 ~ 12 (12-column grid system)
  height: DashboardWidgetHeight;
  order: number;
  config?: DashboardWidgetConfig;
}

export interface DashboardLayoutData {
  version: number;
  widgets: DashboardWidgetItem[];
}
