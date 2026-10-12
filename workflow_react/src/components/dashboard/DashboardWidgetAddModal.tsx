﻿import React from 'react';
import { ModalWrapper, Button } from '@/components/common';
import type { DashboardWidgetType } from '@/types/dashboard';
import {
  Kanban,
  GitBranch,
  Calendar,
  BarChart3,
  Zap,
  ListTodo,
  FileText,
  Plus,
} from 'lucide-react';

interface DashboardWidgetAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: DashboardWidgetType) => void;
}

interface WidgetCatalogItem {
  type: DashboardWidgetType;
  title: string;
  description: string;
  defaultColSpan: string;
  icon: React.ReactNode;
  badge: string;
}

const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'kanban',
    title: '이슈 칸반 보드',
    description: '상태(Status) 및 일감 유형(Type)을 자유롭게 필터링하여 일감을 확인하고 드래그 앤 드롭으로 상태를 변경합니다.',
    defaultColSpan: '기본 6칸 (50%)',
    icon: <Kanban size={22} color="var(--primary)" />,
    badge: '필터링 지원',
  },
  {
    type: 'wbs',
    title: 'WBS 간트 차트',
    description: '프로젝트 일감의 계획 시작일, 마감일, 진행률을 타임라인 바 형태로 요약하여 시각화합니다.',
    defaultColSpan: '기본 12칸 (100%)',
    icon: <GitBranch size={22} color="#4ec9b0" />,
    badge: '일정 시각화',
  },
  {
    type: 'calendar',
    title: '캘린더 일정',
    description: '월간 캘린더 그리드 상에서 일자별 마감 일감을 확인하고 날짜를 클릭하여 상세를 탐색합니다.',
    defaultColSpan: '기본 6칸 (50%)',
    icon: <Calendar size={22} color="#cca700" />,
    badge: '월간 일정',
  },
  {
    type: 'stats',
    title: '작업 현황 요약 카드',
    description: '총 프로젝트 수, 전체 이슈, 진행/검토 중, 완료된 작업 수를 4개의 컴팩트 뱃지로 집계합니다.',
    defaultColSpan: '기본 12칸 (100%)',
    icon: <BarChart3 size={22} color="#9cdcfe" />,
    badge: '전체 통계',
  },
  {
    type: 'sprints',
    title: '관심 스프린트 모니터',
    description: '즐겨찾기한 활성 스프린트의 진행률, 남은 D-Day, 담당자 현황을 집중 모니터링합니다.',
    defaultColSpan: '기본 6칸 (50%)',
    icon: <Zap size={22} color="#f59e0b" />,
    badge: '스프린트',
  },
  {
    type: 'recent-issues',
    title: '최근 및 내 할당 이슈',
    description: '즐겨찾기한 이슈, 최근 등록된 이슈, 나에게 할당된 이슈를 3개 컬럼으로 간결하게 조회합니다.',
    defaultColSpan: '기본 6칸 (50%)',
    icon: <ListTodo size={22} color="#c586c0" />,
    badge: '일감 리스트',
  },
  {
    type: 'memo',
    title: '대시보드 메모장',
    description: '아이디어나 긴급 업무 메모를 대시보드에서 빠르게 작성하고 보관할 수 있는 작업 노트입니다.',
    defaultColSpan: '기본 6칸 (50%)',
    icon: <FileText size={22} color="#4fc1ff" />,
    badge: '빠른 메모',
  },
];

export const DashboardWidgetAddModal: React.FC<DashboardWidgetAddModalProps> = ({
  isOpen,
  onClose,
  onAddWidget,
}) => {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="대시보드 위젯 라이브러리 추가"
      maxWidth="640px"
      zIndex={1500}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
          대시보드에 배치할 위젯 컴포넌트를 선택하세요. 추가 후 언제든지 너비(1~12칸), 높이 및 순서를 자유롭게 조정할 수 있습니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', maxHeight: '450px', overflowY: 'auto', padding: '2px' }}>
          {WIDGET_CATALOG.map((item) => (
            <div
              key={item.type}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.icon}
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                      {item.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      background: 'rgba(0, 122, 204, 0.12)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  {item.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-divider)' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-placeholder)' }}>
                  {item.defaultColSpan}
                </span>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onAddWidget(item.type)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', height: '26px' }}
                >
                  <Plus size={12} /> 추가
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
};
