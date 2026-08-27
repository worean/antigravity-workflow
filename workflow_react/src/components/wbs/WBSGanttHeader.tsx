// -*- coding: utf-8 -*-
import React, { type RefObject } from 'react';
import type { TopHeader, BottomHeaders } from '../../types/wbs';

interface WBSGanttHeaderProps {
  topHeaders: TopHeader[];
  bottomHeaders: BottomHeaders;
  dayWidth: number;
  ganttHeaderRef: RefObject<HTMLDivElement | null>;
}

export const WBSGanttHeader: React.FC<WBSGanttHeaderProps> = ({
  topHeaders,
  bottomHeaders,
  dayWidth,
  ganttHeaderRef,
}) => {
  return (
    <div
      ref={ganttHeaderRef}
      style={{
        height: '52px',
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid var(--border-light)',
        background: '#252526',
        overflowX: 'hidden',
        userSelect: 'none',
        width: '100%',
      }}
    >
      {/* Top Row: Year or Month Headers */}
      <div style={{ display: 'flex', height: '24px', borderBottom: '1px solid #333333' }}>
        {topHeaders.map((h, idx) => (
          <div
            key={idx}
            style={{
              width: `${h.daysCount * dayWidth}px`,
              minWidth: `${h.daysCount * dayWidth}px`,
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--text-bright)',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '6px',
              borderRight: '1px solid #383838',
              boxSizing: 'border-box',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {h.label}
          </div>
        ))}
      </div>

      {/* Bottom Row: Month / Week / Day Headers */}
      <div style={{ display: 'flex', height: '28px' }}>
        {bottomHeaders.type === 'month' &&
          bottomHeaders.blocks.map((b, idx) => (
            <div
              key={idx}
              style={{
                width: `${b.daysCount * dayWidth}px`,
                minWidth: `${b.daysCount * dayWidth}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid #2e2e2e',
                background: b.isCurrent ? 'rgba(0,122,204,0.15)' : 'transparent',
                color: b.isCurrent ? '#9cdcfe' : 'var(--text-sub)',
                fontSize: '0.68rem',
                fontWeight: b.isCurrent ? 700 : 500,
                boxSizing: 'border-box',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {b.label}
            </div>
          ))}

        {bottomHeaders.type === 'week' &&
          bottomHeaders.blocks.map((b, idx) => (
            <div
              key={idx}
              style={{
                width: `${b.daysCount * dayWidth}px`,
                minWidth: `${b.daysCount * dayWidth}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid #2e2e2e',
                background: b.isCurrent ? 'rgba(0,122,204,0.15)' : 'transparent',
                color: b.isCurrent ? '#9cdcfe' : 'var(--text-sub)',
                fontSize: '0.65rem',
                fontWeight: b.isCurrent ? 700 : 400,
                boxSizing: 'border-box',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {b.label}
            </div>
          ))}

        {bottomHeaders.type === 'day' &&
          bottomHeaders.blocks.map((b, idx) => (
            <div
              key={idx}
              style={{
                width: `${dayWidth}px`,
                minWidth: `${dayWidth}px`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid #2e2e2e',
                background: b.isToday ? 'rgba(0,122,204,0.25)' : b.isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent',
                color: b.isToday ? '#9cdcfe' : b.isWeekend ? '#f14c4c' : 'var(--text-sub)',
                fontSize: '0.65rem',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ fontWeight: b.isToday ? 700 : 400 }}>{b.dayNum}</span>
              <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>{b.dayName}</span>
            </div>
          ))}
      </div>
    </div>
  );
};