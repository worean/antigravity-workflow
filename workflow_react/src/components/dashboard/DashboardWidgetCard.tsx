import React, { useState } from 'react';
import type { DashboardWidgetItem, DashboardWidgetHeight } from '@/types/dashboard';
import { useDashboardStore } from '@/stores/useDashboardStore';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Settings,
  Trash2,
  Maximize2,
  Minimize2,
  Columns,
} from 'lucide-react';

interface DashboardWidgetCardProps {
  widget: DashboardWidgetItem;
  children: React.ReactNode;
  onOpenConfig?: () => void;
}

const COL_SPAN_OPTIONS = [
  { value: 3, label: '3칸 (25%)' },
  { value: 4, label: '4칸 (33%)' },
  { value: 6, label: '6칸 (50%)' },
  { value: 8, label: '8칸 (66%)' },
  { value: 12, label: '12칸 (100%)' },
];

const HEIGHT_STYLES: Record<DashboardWidgetHeight, string> = {
  compact: '260px',
  normal: '390px',
  tall: '560px',
};

export const DashboardWidgetCard: React.FC<DashboardWidgetCardProps> = ({
  widget,
  children,
  onOpenConfig,
}) => {
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const updateWidgetColSpan = useDashboardStore((s) => s.updateWidgetColSpan);
  const updateWidgetHeight = useDashboardStore((s) => s.updateWidgetHeight);
  const updateWidgetTitle = useDashboardStore((s) => s.updateWidgetTitle);
  const moveWidget = useDashboardStore((s) => s.moveWidget);
  const removeWidget = useDashboardStore((s) => s.removeWidget);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(widget.title);

  const handleTitleSubmit = () => {
    updateWidgetTitle(widget.id, titleInput);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSubmit();
    if (e.key === 'Escape') {
      setTitleInput(widget.title);
      setIsEditingTitle(false);
    }
  };

  const toggleHeight = () => {
    const nextHeight: DashboardWidgetHeight =
      widget.height === 'compact' ? 'normal' : widget.height === 'normal' ? 'tall' : 'compact';
    updateWidgetHeight(widget.id, nextHeight);
  };

  return (
    <div
      style={{
        gridColumn: `span ${Math.min(12, Math.max(3, widget.colSpan))}`,
        background: 'var(--bg-card)',
        border: isEditMode ? '1px dashed var(--primary)' : '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        display: 'flex',
        flexDirection: 'column',
        height: widget.type === 'stats' ? 'auto' : HEIGHT_STYLES[widget.height],
        boxShadow: isEditMode ? '0 0 10px rgba(0, 122, 204, 0.15)' : 'var(--shadow-sm)',
        transition: 'all 0.18s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Widget Header Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 10px',
          borderBottom: '1px solid var(--border-light)',
          background: isEditMode ? 'rgba(0, 122, 204, 0.08)' : 'rgba(255, 255, 255, 0.015)',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Left: Drag indicator & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
          {isEditMode && (
            <GripVertical size={13} color="var(--primary)" style={{ cursor: 'grab', flexShrink: 0 }} />
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
                width: '180px',
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

        {/* Right Controls: Width, Height, Up/Down, Config, Delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {isEditMode && (
            <>
              {/* Width Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="위젯 너비(컬럼 칸 수) 조절">
                <Columns size={12} color="var(--text-muted)" />
                <select
                  value={widget.colSpan}
                  onChange={(e) => updateWidgetColSpan(widget.id, Number(e.target.value))}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-bright)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.7rem',
                    padding: '2px 4px',
                    height: '22px',
                    cursor: 'pointer',
                  }}
                >
                  {COL_SPAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Height Toggle (stats 제외) */}
              {widget.type !== 'stats' && (
                <button
                  type="button"
                  onClick={toggleHeight}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 5px', height: '22px', fontSize: '0.68rem' }}
                  title={`높이 조절 (현재: ${widget.height})`}
                >
                  {widget.height === 'compact' ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                  <span style={{ marginLeft: '2px' }}>{widget.height}</span>
                </button>
              )}

              {/* Reorder Buttons */}
              <button
                type="button"
                onClick={() => moveWidget(widget.id, 'up')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px', height: '22px' }}
                title="위로 이동"
              >
                <ChevronUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => moveWidget(widget.id, 'down')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px', height: '22px' }}
                title="아래로 이동"
              >
                <ChevronDown size={13} />
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

      {/* Widget Body Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: widget.type === 'stats' ? '4px' : '6px' }}>
        {children}
      </div>
    </div>
  );
};
