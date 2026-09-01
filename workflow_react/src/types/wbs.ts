import type { Sprint, Issue } from './index';

export interface WBSColorTheme {
  name: string;
  base: string;
  border: string;
  progress: string;
  bgEmpty: string;
  parentBase: string;
  parentBorder: string;
  dragBase: string;
  dragBorder: string;
}

export interface WBSItem {
  issue: Issue;
  depth: number;
  hasChildren: boolean;
  startDate: Date | null;
  endDate: Date | null;
  isParent: boolean;
  rootIssueId: number;
  color: WBSColorTheme;
}

export interface DragState {
  issueId: number;
  type: 'move' | 'resize-left' | 'resize-right';
  startX: number;
  initialScrollLeft: number;
  originalStartDate: Date;
  originalDueDate: Date;
  currentStartDate: Date;
  currentDueDate: Date;
}

export interface TreeDropTarget {
  targetId: number | 'root';
  position: 'inside' | 'before' | 'after' | 'root';
}

export interface TimelineRange {
  start: Date;
  end: Date;
  totalDays: number;
  days: Date[];
}

export interface TopHeader {
  label: string;
  daysCount: number;
}

export type BottomHeaders =
  | { type: 'month'; blocks: { label: string; daysCount: number; isCurrent: boolean }[] }
  | { type: 'week'; blocks: { label: string; daysCount: number; isCurrent: boolean }[] }
  | { type: 'day'; blocks: { date: Date; dayNum: number; dayName: string; isToday: boolean; isWeekend: boolean; daysCount: number }[] };

export interface TimelineMarkerLine {
  key: string | number;
  leftPos: number;
  color: string;
  lineStyle?: 'solid' | 'dashed';
  lineWidth?: number;
  zIndex?: number;
  title?: string;
  badge?: {
    show?: boolean;
    label: string;
    icon?: React.ReactNode;
    color?: string;
    bgColor?: string;
    borderColor?: string;
  };
}

export interface SprintDueLine {
  sprint: Sprint;
  leftPos: number;
  formattedDate: string;
}