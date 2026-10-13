import type {
  DashboardWidgetType,
  DashboardWidgetHeight,
  WidgetConfig,
} from './widget';

/**
 * 대시보드 그리드에 배치되는 개별 위젯 아이템 데이터 구조
 */
export interface DashboardWidgetItem {
  id: string;
  type: DashboardWidgetType;
  title: string;
  colSpan: number; // 3 ~ 12 (12-column grid system)
  height: DashboardWidgetHeight;
  customHeight?: number; // 200 ~ 900 (px 단위 사용자 정의 높이)
  order: number;
  config?: WidgetConfig;
}

/**
 * 대시보드 전체 레이아웃 저장/동기화 데이터 모델
 */
export interface DashboardLayoutData {
  version: number;
  widgets: DashboardWidgetItem[];
}

// 하위 호환성을 위한 widget 타입 re-export
export * from './widget';
