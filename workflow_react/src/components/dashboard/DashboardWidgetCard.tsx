import React, { useState, useRef } from 'react';
import type { DashboardWidgetItem } from '@/types/dashboard';
import { useDashboardStore } from '@/stores/useDashboardStore';
import {
  useWidgetResize,
  HEIGHT_PRESETS,
} from './useWidgetResize';
import { DashboardWidgetCardHeader } from './DashboardWidgetCardHeader';
import { DashboardWidgetResizeHandles } from './DashboardWidgetResizeHandles';

interface DashboardWidgetCardProps {
  widget: DashboardWidgetItem;
  children: React.ReactNode;
  onOpenConfig?: () => void;
}

export const DashboardWidgetCard: React.FC<DashboardWidgetCardProps> = ({
  widget,
  children,
  onOpenConfig,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const updateWidgetColSpan = useDashboardStore((s) => s.updateWidgetColSpan);
  const updateWidgetHeight = useDashboardStore((s) => s.updateWidgetHeight);
  const updateWidgetTitle = useDashboardStore((s) => s.updateWidgetTitle);
  const moveWidget = useDashboardStore((s) => s.moveWidget);
  const reorderWidgets = useDashboardStore((s) => s.reorderWidgets);
  const removeWidget = useDashboardStore((s) => s.removeWidget);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(widget.title);
  const [isDragOver, setIsDragOver] = useState(false);

  // 마우스 드래그 리사이즈 훅 (1~12칸 전범위 및 픽셀 피드백 지원)
  const {
    isResizing,
    previewColSpan,
    previewWidthPx,
    previewHeight,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useWidgetResize({
    cardRef,
    colSpan: widget.colSpan,
    height: widget.height,
    customHeight: widget.customHeight,
    isStatsWidget: widget.type === 'stats',
    onUpdateColSpan: (newColSpan) => updateWidgetColSpan(widget.id, newColSpan),
    onUpdateHeight: (newHeightCategory, customHeight) =>
      updateWidgetHeight(widget.id, newHeightCategory, customHeight),
  });

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

  const handleStepColSpan = (delta: number) => {
    const nextCol = Math.min(12, Math.max(1, widget.colSpan + delta));
    updateWidgetColSpan(widget.id, nextCol);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== widget.id) {
      reorderWidgets(sourceId, widget.id);
    }
  };

  const currentHeightPx = widget.customHeight || HEIGHT_PRESETS[widget.height] || 390;
  const displayColSpan = isResizing ? previewColSpan : Math.min(12, Math.max(1, widget.colSpan));
  const displayHeightStyle =
    widget.type === 'stats'
      ? 'auto'
      : isResizing
      ? `${previewHeight}px`
      : `${currentHeightPx}px`;

  return (
    <div
      ref={cardRef}
      onPointerMove={isResizing ? handlePointerMove : undefined}
      onPointerUp={isResizing ? handlePointerUp : undefined}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        gridColumn: `span ${displayColSpan}`,
        background: 'var(--bg-card)',
        border: isEditMode
          ? isDragOver
            ? '2px dashed var(--primary)'
            : isResizing
            ? '1.5px solid var(--primary)'
            : '1px dashed var(--primary)'
          : '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        display: 'flex',
        flexDirection: 'column',
        height: displayHeightStyle,
        boxShadow: isResizing
          ? '0 0 16px rgba(0, 122, 204, 0.35)'
          : isDragOver
          ? '0 0 14px rgba(0, 122, 204, 0.3)'
          : isEditMode
          ? '0 0 10px rgba(0, 122, 204, 0.15)'
          : 'var(--shadow-sm)',
        transition: isResizing ? 'none' : 'box-shadow 0.18s ease, border-color 0.18s ease',
        overflow: 'hidden',
        position: 'relative',
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      {/* Widget Header Toolbar */}
      <DashboardWidgetCardHeader
        widget={widget}
        isEditMode={isEditMode}
        onOpenConfig={onOpenConfig}
        titleInput={titleInput}
        isEditingTitle={isEditingTitle}
        setIsEditingTitle={setIsEditingTitle}
        setTitleInput={setTitleInput}
        handleTitleSubmit={handleTitleSubmit}
        handleTitleKeyDown={handleTitleKeyDown}
        handleStepColSpan={handleStepColSpan}
        updateWidgetColSpan={updateWidgetColSpan}
        updateWidgetHeight={updateWidgetHeight}
        moveWidget={moveWidget}
        removeWidget={removeWidget}
      />

      {/* Widget Body Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: widget.type === 'stats' ? '4px' : '6px' }}>
        {children}
      </div>

      {/* Interactive Drag-to-Resize Handles & Feedback Overlay */}
      {isEditMode && (
        <DashboardWidgetResizeHandles
          isResizing={isResizing}
          previewColSpan={previewColSpan}
          previewWidthPx={previewWidthPx}
          previewHeight={previewHeight}
          isStatsWidget={widget.type === 'stats'}
          onPointerDown={handlePointerDown}
        />
      )}
    </div>
  );
};
