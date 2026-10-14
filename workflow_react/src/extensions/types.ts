import React from 'react';

/**
 * 🔌 AntiGravity UI 확장 포인트 (Extension Points)
 */
export type ExtensionPoint =
  | 'project.card.badge'       // 프로젝트 카드 헤더 뱃지 슬롯
  | 'project.card.action'      // 프로젝트 카드 헤더 액션 버튼 슬롯
  | 'project.toolbar.action'   // 프로젝트 목록 상단 툴바 액션 슬롯
  | 'issue.detail.section'     // 일감 상세 드로어/모달 확장 섹션 슬롯
  | 'settings.tab';            // 설정 페이지 확장 탭 슬롯

/**
 * 🧩 플러그인 UI 확장 인터페이스 (IExtension)
 */
export interface IExtension<TContext = any> {
  /** 고유 식별자 (예: 'plugin.git.project.action') */
  readonly id: string;
  /** 타겟 확장 슬롯 */
  readonly point: ExtensionPoint;
  /** 사람이 읽을 수 있는 명칭 */
  readonly name: string;
  /** 정렬 우선순위 (낮을수록 앞쪽에 배치, 기본값: 100) */
  readonly order?: number;
  /** 확장 기능 활성화 조건 함수 (false 반환 시 렌더링 제외) */
  readonly isEnabled?: (context: TContext) => boolean;
  /** UI 렌더링 함수 */
  readonly render: (context: TContext) => React.ReactNode;
}

/**
 * 프로젝트 관련 확장 컨텍스트
 */
export interface ProjectExtensionContext {
  project: {
    id: number;
    key: string;
    name: string;
    visibility?: string;
    [key: string]: any;
  };
  onSelectProject?: (projectId: number) => void;
  [key: string]: any;
}

/**
 * 일감 관련 확장 컨텍스트
 */
export interface IssueExtensionContext {
  issue: {
    id: number;
    issueNumber?: number;
    title: string;
    projectId?: number;
    [key: string]: any;
  };
  [key: string]: any;
}
