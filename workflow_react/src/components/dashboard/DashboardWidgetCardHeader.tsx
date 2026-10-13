import React from 'react';
import type { DashboardWidgetItem, DashboardWidgetHeight } from '@/types/dashboard';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Settings,
  Trash2,
  Columns,
  Minus,
  Plus,
} from 'lucide-react';

interface DashboardWidgetCardHeaderProps {
  widget: DashboardWidgetItem;
  isEditMode: boolean;
  onOpenConfig?: () => void;
  titleInput: string;
  isEditingTitle: boolean;
  setIsEditingTitle: (editing: boolean) => void;
  setTitleInput: (title: string) => void;
  handleTitleSubmit: () => void;
  handleTitleKeyDown: (e: React.KeyboardEvent) => void;
  handleStepColSpan: (delta: number) => void;
  updateWidgetColSpan: (id: string, colSpan: number) => void;
  updateWidgetHeight: (id: string, height: DashboardWidgetHeight) => void;
  moveWidget: (id: string, dir: 'up' | 'down') => void;
  removeWidget: (id: string) => void;
}

const COL_SPAN_OPTIONS = [
  { value: 1, label: '1칸 (8%)' },
  { value: 2, label: '2칸 (17%)' },
  { value: 3, label: '3칸 (25%)' },
  { value: 4, label: '4칸 (33%)' },
  { value: 6, label: '6칸 (50%)' },
  { value: 8, label: '8칸 (66%)' },
  { value: 9, label: '9칸 (75%)' },
  { value: 12, label: '12칸 (100%)' },
];

export const DashboardWidgetCardHeader: React.FC<DashboardWidgetCardHeaderProps> = ({
  widget,
  isEditMode,
  onOpenConfig,
  titleInput,
  isEditingTitle,
  setIsEditingTitle,
  setTitleInput,
  handleTitleSubmit,
  handleTitleKeyDown,
  handleStepColSpan,
  updateWidgetColSpan,
  updateWidgetHeight,
  moveWidget,
  removeWidget,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        borderBottom: '1px solid var(--border-light)',
        background: isEditMode ? 'rgba(0, 122, 204, 0.08)' : 'rgba(255, 255, 255, 0.015)',
        gap: '6px',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      {/* Left: Drag indicator & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '120px', flex: 1 }}>
        {isEditMode && (
          <span
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', widget.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            title="마우스로 잡고 드래그하여 위젯 위치를 원하는 곳으로 옮기거나, 우측 화살표 버튼을 누르세요"
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'grab',
              padding: '2px',
              borderRadius: '2px',
              background: 'rgba(0, 122, 204, 0.15)',
            }}
          >
            <GripVertical size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
          </span>
        )}

        {isEditingTitle ? (
          <input
            type="text"
            className="form-control"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '2px 6px',
              height: '24px',
              width: '160px',
            }}
          />
        ) : (
          <span
            onClick={() => isEditMode && setIsEditingTitle(true)}
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-bright)',
              cursor: isEditMode ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={isEditMode ? '클릭하여 위젯 이름 변경' : widget.title}
          >
            {widget.title}
          </span>
        )}
      </div>

      {/* Right Controls: Width Stepper, Height Segmented Buttons, Reorder, Config, Delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        {isEditMode && (
          <>
            {/* Width Stepper & Dropdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                padding: '1px 2px',
                gap: '2px',
              }}
              title="너비 조절 (- / + 또는 드롭다운 선택, 혹은 카드 우측 가장자리를 마우스로 드래그)"
            >
              <button
                type="button"
                onClick={() => handleStepColSpan(-1)}
                disabled={widget.colSpan <= 1}
                className="btn btn-secondary btn-sm"
                style={{ padding: '1px 3px', height: '20px', opacity: widget.colSpan <= 1 ? 0.4 : 1 }}
                title="너비 1칸 축소 (최소 1칸)"
              >
                <Minus size={10} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0 2px' }}>
                <Columns size={11} color="var(--primary)" />
                <select
                  value={widget.colSpan}
                  onChange={(e) => updateWidgetColSpan(widget.id, Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-bright)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '0 2px',
                    height: '20px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {COL_SPAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleStepColSpan(1)}
                disabled={widget.colSpan >= 12}
                className="btn btn-secondary btn-sm"
                style={{ padding: '1px 3px', height: '20px', opacity: widget.colSpan >= 12 ? 0.4 : 1 }}
                title="너비 1칸 확대 (최대 12칸)"
              >
                <Plus size={10} />
              </button>
            </div>

            {/* Height Segmented Buttons (stats 위젯 제외) */}
            {widget.type !== 'stats' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '1px 2px',
                  gap: '2px',
                }}
                title="높이 프리셋 조절 (소: 260px, 중: 390px, 대: 560px, 또는 카드 하단 모서리를 마우스로 드래그)"
              >
                {(['compact', 'normal', 'tall'] as DashboardWidgetHeight[]).map((h) => {
                  const isSelected = widget.height === h && !widget.customHeight;
                  const label = h === 'compact' ? '소' : h === 'normal' ? '중' : '대';
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateWidgetHeight(widget.id, h)}
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '1px 5px',
                        height: '20px',
                        fontSize: '0.65rem',
                        fontWeight: isSelected ? 700 : 500,
                      }}
                      title={`높이: ${h === 'compact' ? '260px' : h === 'normal' ? '390px' : '560px'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reorder Buttons */}
            <button
              type="button"
              onClick={() => moveWidget(widget.id, 'up')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px', height: '22px' }}
              title="위로 이동"
            >
              <ChevronUp size={12} />
            </button>
            <button
              type="button"
              onClick={() => moveWidget(widget.id, 'down')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px', height: '22px' }}
              title="아래로 이동"
            >
              <ChevronDown size={12} />
            </button>
          </>
        )}

        {/* Config Button (Kanban 등 전용 설정) */}
        {onOpenConfig && (
          <button
            type="button"
            onClick={onOpenConfig}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '2px 5px',
              height: '22px',
              color: widget.type === 'kanban' && widget.config?.statusCategories?.length ? 'var(--primary)' : 'var(--text-sub)',
            }}
            title="위젯 필터 설정"
          >
            <Settings size={12} />
          </button>
        )}

        {/* Delete Button (편집 모드 시) */}
        {isEditMode && (
          <button
            type="button"
            onClick={() => removeWidget(widget.id)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '2px 4px', height: '22px', color: '#f14c4c' }}
            title="위젯 삭제"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
