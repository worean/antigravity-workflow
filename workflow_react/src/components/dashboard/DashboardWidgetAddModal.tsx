import React from 'react';
import { ModalWrapper, Button } from '@/components/common';
import type { DashboardWidgetType } from '@/types/widget';
import { getAllWidgetDefinitions } from './widgetRegistry';
import { Plus } from 'lucide-react';

interface DashboardWidgetAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: DashboardWidgetType) => void;
}

export const DashboardWidgetAddModal: React.FC<DashboardWidgetAddModalProps> = ({
  isOpen,
  onClose,
  onAddWidget,
}) => {
  const widgetCatalog = getAllWidgetDefinitions();

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
          대시보드에 배치할 위젯 컴포넌트를 선택하세요. 각 위젯 컴포넌트는 독립적인 위젯 규격(Widgetable)을 제공하며, 추가 후 언제든지 너비(3~12칸), 높이 및 순서를 자유롭게 조정할 수 있습니다.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '10px',
            maxHeight: '450px',
            overflowY: 'auto',
            padding: '2px',
          }}
        >
          {widgetCatalog.map((item) => {
            const colPercent = Math.round((item.defaultColSpan / 12) * 100);
            return (
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.icon}
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                        {item.title}
                      </span>
                    </div>
                    {item.badge && (
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
                    )}
                  </div>

                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                    {item.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-divider)',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-placeholder)' }}>
                    기본 {item.defaultColSpan}칸 ({colPercent}%)
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
            );
          })}
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
