﻿import { create } from 'zustand';
import { safeStorage } from '@/utils/safeStorage';
import type {
  DashboardWidgetItem,
  DashboardWidgetType,
  DashboardWidgetHeight,
  DashboardWidgetConfig,
  DashboardLayoutData,
} from '@/types/dashboard';

const STORAGE_KEY = 'dashboard_widgets_v1';

export const DEFAULT_WIDGETS: DashboardWidgetItem[] = [
  {
    id: 'default-stat-cards',
    type: 'stats',
    title: '작업 및 프로젝트 현황 요약',
    colSpan: 12,
    height: 'compact',
    order: 0,
    config: {},
  },
  {
    id: 'default-kanban-board',
    type: 'kanban',
    title: '이슈 칸반 보드',
    colSpan: 7,
    height: 'normal',
    order: 1,
    config: {
      statusCategories: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
      typeIds: [],
      projectId: 'ALL',
      assigneeFilter: 'ALL',
    },
  },
  {
    id: 'default-calendar-mini',
    type: 'calendar',
    title: '캘린더 일정',
    colSpan: 5,
    height: 'normal',
    order: 2,
    config: {},
  },
  {
    id: 'default-wbs-gantt',
    type: 'wbs',
    title: 'WBS 일정 진행 현황',
    colSpan: 12,
    height: 'normal',
    order: 3,
    config: {},
  },
  {
    id: 'default-focus-sprints',
    type: 'sprints',
    title: '관심 스프린트 모니터',
    colSpan: 6,
    height: 'normal',
    order: 4,
    config: {},
  },
  {
    id: 'default-recent-issues',
    type: 'recent-issues',
    title: '최근 및 내 할당 이슈',
    colSpan: 6,
    height: 'normal',
    order: 5,
    config: {},
  },
];

export const WIDGET_DEFAULT_TITLES: Record<DashboardWidgetType, string> = {
  stats: '작업 및 프로젝트 현황 요약',
  kanban: '이슈 칸반 보드',
  calendar: '캘린더 일정',
  wbs: 'WBS 일정 진행 현황',
  sprints: '관심 스프린트 모니터',
  'recent-issues': '최근 및 내 할당 이슈',
  memo: '대시보드 메모장',
};

export const WIDGET_DEFAULT_COL_SPANS: Record<DashboardWidgetType, number> = {
  stats: 12,
  kanban: 6,
  calendar: 6,
  wbs: 12,
  sprints: 6,
  'recent-issues': 6,
  memo: 6,
};

interface DashboardStoreState {
  widgets: DashboardWidgetItem[];
  isEditMode: boolean;
  isAddModalOpen: boolean;
  editingWidgetIdForConfig: string | null;

  // Actions
  setIsEditMode: (editMode: boolean) => void;
  toggleEditMode: () => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  openWidgetConfigModal: (widgetId: string) => void;
  closeWidgetConfigModal: () => void;

  addWidget: (type: DashboardWidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidgetColSpan: (id: string, colSpan: number) => void;
  updateWidgetHeight: (id: string, height: DashboardWidgetHeight) => void;
  updateWidgetTitle: (id: string, title: string) => void;
  updateWidgetConfig: (id: string, config: Partial<DashboardWidgetConfig>) => void;
  moveWidget: (id: string, direction: 'up' | 'down') => void;
  resetToDefaultLayout: () => void;
  loadFromUserPreferences: (preferencesStr?: string | null) => void;
}

const getInitialWidgets = (): DashboardWidgetItem[] => {
  const saved = safeStorage.getItem<DashboardLayoutData | null>(STORAGE_KEY, null);
  if (saved && Array.isArray(saved.widgets) && saved.widgets.length > 0) {
    return saved.widgets.sort((a, b) => a.order - b.order);
  }
  return DEFAULT_WIDGETS;
};

const persistWidgets = (widgets: DashboardWidgetItem[]) => {
  safeStorage.setItem<DashboardLayoutData>(STORAGE_KEY, {
    version: 1,
    widgets,
  });
};

export const useDashboardStore = create<DashboardStoreState>((set, get) => ({
  widgets: getInitialWidgets(),
  isEditMode: false,
  isAddModalOpen: false,
  editingWidgetIdForConfig: null,

  setIsEditMode: (isEditMode) => set({ isEditMode }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  openAddModal: () => set({ isAddModalOpen: true }),
  closeAddModal: () => set({ isAddModalOpen: false }),

  openWidgetConfigModal: (widgetId) => set({ editingWidgetIdForConfig: widgetId }),
  closeWidgetConfigModal: () => set({ editingWidgetIdForConfig: null }),

  addWidget: (type) => {
    const { widgets } = get();
    const newId = `widget-${type}-${Date.now()}`;
    const nextOrder = widgets.length > 0 ? Math.max(...widgets.map((w) => w.order)) + 1 : 0;

    const newWidget: DashboardWidgetItem = {
      id: newId,
      type,
      title: WIDGET_DEFAULT_TITLES[type] || '위젯',
      colSpan: WIDGET_DEFAULT_COL_SPANS[type] || 6,
      height: type === 'stats' ? 'compact' : 'normal',
      order: nextOrder,
      config: type === 'kanban' ? {
        statusCategories: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
        typeIds: [],
        projectId: 'ALL',
        assigneeFilter: 'ALL',
      } : {},
    };

    const nextWidgets = [...widgets, newWidget];
    persistWidgets(nextWidgets);
    set({ widgets: nextWidgets, isAddModalOpen: false });
  },

  removeWidget: (id) => {
    const { widgets } = get();
    if (widgets.length <= 1) return; // 최소 1개 유지
    const nextWidgets = widgets
      .filter((w) => w.id !== id)
      .map((w, idx) => ({ ...w, order: idx }));
    persistWidgets(nextWidgets);
    set({ widgets: nextWidgets });
  },

  updateWidgetColSpan: (id, colSpan) => {
    const validColSpan = Math.min(12, Math.max(3, colSpan));
    const nextWidgets = get().widgets.map((w) =>
      w.id === id ? { ...w, colSpan: validColSpan } : w
    );
    persistWidgets(nextWidgets);
    set({ widgets: nextWidgets });
  },

  updateWidgetHeight: (id, height) => {
    const nextWidgets = get().widgets.map((w) =>
      w.id === id ? { ...w, height } : w
    );
    persistWidgets(nextWidgets);
    set({ widgets: nextWidgets });
  },

  updateWidgetTitle: (id, title) => {
    const nextWidgets = get().widgets.map((w) =>
      w.id === id ? { ...w, title: title.trim() || WIDGET_DEFAULT_TITLES[w.type] } : w
    );
    persistWidgets(nextWidgets);
    set({ widgets: nextWidgets });
  },

  updateWidgetConfig: (id, config) => {
    const nextWidgets = get().widgets.map((w) =>
      w.id === id ? { ...w, config: { ...(w.config || {}), ...config } } : w
    );
    persistWidgets(nextWidgets);
    set({ widgets: nextWidgets });
  },

  moveWidget: (id, direction) => {
    const sorted = [...get().widgets].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((w) => w.id === id);
    if (index < 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const temp = sorted[index];
    sorted[index] = sorted[targetIndex];
    sorted[targetIndex] = temp;

    const nextWidgets = sorted.map((w, idx) => ({ ...w, order: idx }));
    persistWidgets(nextWidgets);
    set({ widgets: nextWidgets });
  },

  resetToDefaultLayout: () => {
    persistWidgets(DEFAULT_WIDGETS);
    set({ widgets: DEFAULT_WIDGETS });
  },

  loadFromUserPreferences: (preferencesStr) => {
    if (!preferencesStr) return;
    try {
      const parsed = JSON.parse(preferencesStr);
      if (parsed?.dashboardConfig?.widgets && Array.isArray(parsed.dashboardConfig.widgets)) {
        const backendWidgets = parsed.dashboardConfig.widgets as DashboardWidgetItem[];
        if (backendWidgets.length > 0) {
          persistWidgets(backendWidgets);
          set({ widgets: backendWidgets });
        }
      }
    } catch (err) {
      console.warn('[useDashboardStore] Failed to parse dashboard config from preferences:', err);
    }
  },
}));
