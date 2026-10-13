import type { DashboardWidgetType, Widgetable } from '@/types/widget';
import { kanbanWidgetDefinition } from '@/components/kanban';
import { wbsWidgetDefinition } from '@/components/wbs';
import { calendarWidgetDefinition } from '@/components/calendar';
import { memoWidgetDefinition } from '@/components/memos';
import {
  statCardsWidgetDefinition,
  focusSprintsWidgetDefinition,
  recentIssuesWidgetDefinition,
} from './widgets';

/**
 * 대시보드 위젯 중앙 레지스트리 (DashboardWidgetRegistry)
 * Widgetable 인터페이스를 구현한 각 도메인 컴포넌트의 위젯을 동적으로 등록하고 관리합니다.
 */
class DashboardWidgetRegistry {
  private registry = new Map<DashboardWidgetType, Widgetable>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    this.register(statCardsWidgetDefinition);
    this.register(kanbanWidgetDefinition);
    this.register(calendarWidgetDefinition);
    this.register(wbsWidgetDefinition);
    this.register(focusSprintsWidgetDefinition);
    this.register(recentIssuesWidgetDefinition);
    this.register(memoWidgetDefinition);
  }

  /**
   * Widgetable 인터페이스를 만족하는 새 위젯을 대시보드 시스템에 등록합니다.
   */
  public register<T = any>(widget: Widgetable<T>): void {
    if (!widget || !widget.type) {
      console.warn('Invalid widget definition passed to registerWidget:', widget);
      return;
    }
    this.registry.set(widget.type, widget as Widgetable<any>);
  }

  /**
   * 특정 타입의 위젯 등록을 해제합니다.
   */
  public unregister(type: DashboardWidgetType): void {
    this.registry.delete(type);
  }

  /**
   * 위젯 타입으로 등록된 Widgetable 명세를 조회합니다.
   */
  public get<T = any>(type: DashboardWidgetType): Widgetable<T> | undefined {
    return this.registry.get(type) as Widgetable<T> | undefined;
  }

  /**
   * 현재 등록된 모든 Widgetable 명세 목록을 반환합니다.
   */
  public getAll(): Widgetable[] {
    return Array.from(this.registry.values());
  }

  /**
   * 특정 위젯 타입이 레지스트리에 존재하는지 확인합니다.
   */
  public has(type: DashboardWidgetType): boolean {
    return this.registry.has(type);
  }
}

export const widgetRegistry = new DashboardWidgetRegistry();

export const registerWidget = <T = any>(widget: Widgetable<T>) => widgetRegistry.register(widget);
export const unregisterWidget = (type: DashboardWidgetType) => widgetRegistry.unregister(type);
export const getWidgetDefinition = <T = any>(type: DashboardWidgetType) => widgetRegistry.get<T>(type);
export const getAllWidgetDefinitions = () => widgetRegistry.getAll();
export const hasWidgetDefinition = (type: DashboardWidgetType) => widgetRegistry.has(type);

/**
 * 대상 객체가 Widgetable 인터페이스 규격을 만족하는지 판별하는 타입 가드 함수
 */
export const isWidgetable = (item: any): item is Widgetable => {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.type === 'string' &&
    typeof item.title === 'string' &&
    typeof item.Component === 'function' &&
    typeof item.defaultColSpan === 'number' &&
    typeof item.defaultHeight === 'string'
  );
};
