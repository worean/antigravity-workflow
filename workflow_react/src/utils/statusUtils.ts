import { Circle, Clock, Eye, CheckCircle2, AlertCircle, ArrowUp, ArrowDown, Minus, CheckSquare, Bug, Sparkles, Wrench } from 'lucide-react';

/**
 * ============================================================================
 * 1. Status (상태) 단일 소스 메타데이터 및 유틸리티
 * ============================================================================
 */
export type StatusCategory = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface StatusMeta {
  id: number;
  key: StatusCategory;
  name: string;
  koreanLabel: string;
  fullLabel: string;
  color: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
}

export const STATUS_CONFIG: Record<StatusCategory, StatusMeta> = {
  TODO: {
    id: 1,
    key: 'TODO',
    name: 'TODO',
    koreanLabel: '할 일',
    fullLabel: '할 일 (TODO)',
    color: '#9cdcfe',
    bg: '#2d2d2d',
    border: '#3c3c3c',
    Icon: Circle,
  },
  IN_PROGRESS: {
    id: 2,
    key: 'IN_PROGRESS',
    name: 'IN_PROGRESS',
    koreanLabel: '진행 중',
    fullLabel: '진행 중 (IN_PROGRESS)',
    color: '#70b7ff',
    bg: 'rgba(0, 122, 204, 0.2)',
    border: 'rgba(0, 122, 204, 0.4)',
    Icon: Clock,
  },
  IN_REVIEW: {
    id: 3,
    key: 'IN_REVIEW',
    name: 'IN_REVIEW',
    koreanLabel: '검토 중',
    fullLabel: '검토 중 (IN_REVIEW)',
    color: '#dcdcaa',
    bg: 'rgba(220, 220, 170, 0.15)',
    border: 'rgba(220, 220, 170, 0.3)',
    Icon: Eye,
  },
  DONE: {
    id: 4,
    key: 'DONE',
    name: 'DONE',
    koreanLabel: '완료',
    fullLabel: '완료 (DONE)',
    color: '#4ec9b0',
    bg: 'rgba(78, 201, 176, 0.15)',
    border: 'rgba(78, 201, 176, 0.3)',
    Icon: CheckCircle2,
  },
};

export const STATUS_LIST: StatusMeta[] = [
  STATUS_CONFIG.TODO,
  STATUS_CONFIG.IN_PROGRESS,
  STATUS_CONFIG.IN_REVIEW,
  STATUS_CONFIG.DONE,
];

export const STATUS_ID_MAP: Record<number, StatusMeta> = {
  1: STATUS_CONFIG.TODO,
  2: STATUS_CONFIG.IN_PROGRESS,
  3: STATUS_CONFIG.IN_REVIEW,
  4: STATUS_CONFIG.DONE,
};

export const parseStatusCategory = (input?: any): StatusCategory => {
  if (!input) return 'TODO';
  if (typeof input === 'number') {
    return STATUS_ID_MAP[input]?.key || 'TODO';
  }
  if (typeof input === 'string') {
    const upper = input.toUpperCase();
    if (upper in STATUS_CONFIG) return upper as StatusCategory;
    if (upper === '1') return 'TODO';
    if (upper === '2') return 'IN_PROGRESS';
    if (upper === '3') return 'IN_REVIEW';
    if (upper === '4') return 'DONE';
    return 'TODO';
  }
  if (typeof input === 'object') {
    if (input.category && input.category.toUpperCase() in STATUS_CONFIG) {
      return input.category.toUpperCase() as StatusCategory;
    }
    if (input.name && input.name.toUpperCase() in STATUS_CONFIG) {
      return input.name.toUpperCase() as StatusCategory;
    }
    if (input.id && input.id in STATUS_ID_MAP) {
      return STATUS_ID_MAP[input.id].key;
    }
  }
  return 'TODO';
};

export const getStatusMeta = (input?: any): StatusMeta => {
  const cat = parseStatusCategory(input);
  return STATUS_CONFIG[cat];
};

/**
 * ============================================================================
 * 2. Priority (우선순위) 단일 소스 메타데이터 및 유틸리티
 * ============================================================================
 */
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PriorityMeta {
  id: number;
  key: PriorityLevel;
  name: string;
  koreanLabel: string;
  fullLabel: string;
  color: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
}

export const PRIORITY_CONFIG: Record<PriorityLevel, PriorityMeta> = {
  LOW: {
    id: 1,
    key: 'LOW',
    name: 'LOW',
    koreanLabel: '낮음',
    fullLabel: '낮음 (LOW)',
    color: '#858585',
    bg: '#2d2d2d',
    border: '#3c3c3c',
    Icon: ArrowDown,
  },
  MEDIUM: {
    id: 2,
    key: 'MEDIUM',
    name: 'MEDIUM',
    koreanLabel: '보통',
    fullLabel: '보통 (MEDIUM)',
    color: '#9cdcfe',
    bg: 'rgba(0, 122, 204, 0.15)',
    border: 'rgba(0, 122, 204, 0.3)',
    Icon: Minus,
  },
  HIGH: {
    id: 3,
    key: 'HIGH',
    name: 'HIGH',
    koreanLabel: '높음',
    fullLabel: '높음 (HIGH)',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    Icon: ArrowUp,
  },
  CRITICAL: {
    id: 4,
    key: 'CRITICAL',
    name: 'CRITICAL',
    koreanLabel: '긴급',
    fullLabel: '긴급 (CRITICAL)',
    color: '#f14c4c',
    bg: 'rgba(241, 76, 76, 0.18)',
    border: 'rgba(241, 76, 76, 0.5)',
    Icon: AlertCircle,
  },
};


export const PRIORITY_LIST: PriorityMeta[] = [
  PRIORITY_CONFIG.LOW,
  PRIORITY_CONFIG.MEDIUM,
  PRIORITY_CONFIG.HIGH,
  PRIORITY_CONFIG.CRITICAL,
];

export const PRIORITY_ID_MAP: Record<number, PriorityMeta> = {
  1: PRIORITY_CONFIG.LOW,
  2: PRIORITY_CONFIG.MEDIUM,
  3: PRIORITY_CONFIG.HIGH,
  4: PRIORITY_CONFIG.CRITICAL,
};

export const parsePriorityLevel = (input?: any): PriorityLevel => {
  if (!input) return 'MEDIUM';
  if (typeof input === 'number') {
    return PRIORITY_ID_MAP[input]?.key || 'MEDIUM';
  }
  if (typeof input === 'string') {
    const upper = input.toUpperCase();
    if (upper in PRIORITY_CONFIG) return upper as PriorityLevel;
    if (upper === '1') return 'LOW';
    if (upper === '2') return 'MEDIUM';
    if (upper === '3') return 'HIGH';
    if (upper === '4') return 'CRITICAL';
    return 'MEDIUM';
  }
  if (typeof input === 'object') {
    if (input.name && input.name.toUpperCase() in PRIORITY_CONFIG) {
      return input.name.toUpperCase() as PriorityLevel;
    }
    if (input.level && input.level.toUpperCase() in PRIORITY_CONFIG) {
      return input.level.toUpperCase() as PriorityLevel;
    }
    if (input.id && input.id in PRIORITY_ID_MAP) {
      return PRIORITY_ID_MAP[input.id].key;
    }
  }
  return 'MEDIUM';
};

export const getPriorityMeta = (input?: any): PriorityMeta => {
  const level = parsePriorityLevel(input);
  return PRIORITY_CONFIG[level];
};

/**
 * ============================================================================
 * 3. IssueType (이슈 유형) 단일 소스 메타데이터 및 유틸리티
 * ============================================================================
 */
export type IssueTypeKey = 'TASK' | 'BUG' | 'FEATURE' | 'IMPROVEMENT';

export interface IssueTypeMeta {
  id: number;
  key: IssueTypeKey;
  name: string;
  koreanLabel: string;
  fullLabel: string;
  color: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
}

export const ISSUE_TYPE_CONFIG: Record<IssueTypeKey, IssueTypeMeta> = {
  TASK: {
    id: 1,
    key: 'TASK',
    name: 'TASK',
    koreanLabel: '작업',
    fullLabel: '작업 (TASK)',
    color: '#9cdcfe',
    bg: 'rgba(0, 122, 204, 0.15)',
    border: 'rgba(0, 122, 204, 0.3)',
    Icon: CheckSquare,
  },
  BUG: {
    id: 2,
    key: 'BUG',
    name: 'BUG',
    koreanLabel: '버그',
    fullLabel: '버그 (BUG)',
    color: '#f14c4c',
    bg: 'rgba(241, 76, 76, 0.15)',
    border: 'rgba(241, 76, 76, 0.3)',
    Icon: Bug,
  },
  FEATURE: {
    id: 3,
    key: 'FEATURE',
    name: 'FEATURE',
    koreanLabel: '새 기능',
    fullLabel: '새 기능 (FEATURE)',
    color: '#4ec9b0',
    bg: 'rgba(78, 201, 176, 0.15)',
    border: 'rgba(78, 201, 176, 0.3)',
    Icon: Sparkles,
  },
  IMPROVEMENT: {
    id: 4,
    key: 'IMPROVEMENT',
    name: 'IMPROVEMENT',
    koreanLabel: '개선',
    fullLabel: '개선 (IMPROVEMENT)',
    color: '#c586c0',
    bg: 'rgba(197, 134, 192, 0.15)',
    border: 'rgba(197, 134, 192, 0.3)',
    Icon: Wrench,
  },
};

export const ISSUE_TYPE_LIST: IssueTypeMeta[] = [
  ISSUE_TYPE_CONFIG.TASK,
  ISSUE_TYPE_CONFIG.BUG,
  ISSUE_TYPE_CONFIG.FEATURE,
  ISSUE_TYPE_CONFIG.IMPROVEMENT,
];

export const ISSUE_TYPE_ID_MAP: Record<number, IssueTypeMeta> = {
  1: ISSUE_TYPE_CONFIG.TASK,
  2: ISSUE_TYPE_CONFIG.BUG,
  3: ISSUE_TYPE_CONFIG.FEATURE,
  4: ISSUE_TYPE_CONFIG.IMPROVEMENT,
};

export const parseIssueTypeKey = (input?: any): IssueTypeKey => {
  if (!input) return 'TASK';
  if (typeof input === 'number') {
    return ISSUE_TYPE_ID_MAP[input]?.key || 'TASK';
  }
  if (typeof input === 'string') {
    const upper = input.toUpperCase();
    if (upper in ISSUE_TYPE_CONFIG) return upper as IssueTypeKey;
    if (upper === '1') return 'TASK';
    if (upper === '2') return 'BUG';
    if (upper === '3') return 'FEATURE';
    if (upper === '4') return 'IMPROVEMENT';
    return 'TASK';
  }
  if (typeof input === 'object') {
    if (input.name && input.name.toUpperCase() in ISSUE_TYPE_CONFIG) {
      return input.name.toUpperCase() as IssueTypeKey;
    }
    if (input.key && input.key.toUpperCase() in ISSUE_TYPE_CONFIG) {
      return input.key.toUpperCase() as IssueTypeKey;
    }
    if (input.id && input.id in ISSUE_TYPE_ID_MAP) {
      return ISSUE_TYPE_ID_MAP[input.id].key;
    }
  }
  return 'TASK';
};

export const getIssueTypeMeta = (input?: any): IssueTypeMeta => {
  const key = parseIssueTypeKey(input);
  return ISSUE_TYPE_CONFIG[key];
};
