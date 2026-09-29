import React from 'react';
import type { MemoColor, MemoFilterType } from '@/types/memo';
import { Search, Plus, X } from 'lucide-react';

export interface MemoFilterBarProps {
  search: string;
  issueFilter: MemoFilterType;
  selectedColor: MemoColor | 'ALL';
  onSearchChange: (search: string) => void;
  onIssueFilterChange: (type: MemoFilterType) => void;
  onColorChange: (color: MemoColor | 'ALL') => void;
  totalCount: number;
  filteredCount: number;
  onNewMemo: () => void;
}

const COLOR_CHIPS: { key: MemoColor; label: string; color: string }[] = [
  { key: 'yellow', label: '노랑', color: '#eab308' },
  { key: 'blue', label: '파랑', color: '#3b82f6' },
  { key: 'green', label: '초록', color: '#22c55e' },
  { key: 'pink', label: '분홍', color: '#ec4899' },
  { key: 'purple', label: '보라', color: '#a855f7' },
];

export const MemoFilterBar: React.FC<MemoFilterBarProps> = ({
  search,
  issueFilter,
  selectedColor,
  onSearchChange,
  onIssueFilterChange,
  onColorChange,
  totalCount,
  filteredCount,
  onNewMemo,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xs, 4px)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative', minWidth: '180px' }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '7px' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="메모 내용 검색..."
            style={{
              padding: '4px 24px 4px 26px',
              fontSize: '0.78rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-light)',
              borderRadius: '3px',
              color: 'var(--text-bright)',
              outline: 'none',
              width: '180px',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{ position: 'absolute', right: '6px', top: '5px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '3px', border: '1px solid var(--border-light)' }}>
          {(['ALL', 'ISSUE_ONLY', 'STANDALONE'] as MemoFilterType[]).map((type) => {
            const labels: Record<MemoFilterType, string> = {
              ALL: '전체',
              ISSUE_ONLY: '이슈 연동',
              STANDALONE: '단독 메모',
            };
            const active = issueFilter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onIssueFilterChange(type)}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  border: 'none',
                  background: active ? 'var(--primary)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-sub)',
                  cursor: 'pointer',
                  borderRadius: type === 'ALL' ? '2px 0 0 2px' : type === 'STANDALONE' ? '0 2px 2px 0' : 0,
                }}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            type="button"
            onClick={() => onColorChange('ALL')}
            style={{
              padding: '2px 6px',
              fontSize: '0.68rem',
              border: selectedColor === 'ALL' ? '1px solid var(--primary)' : '1px solid var(--border-light)',
              background: selectedColor === 'ALL' ? 'var(--primary-subtle)' : 'var(--bg-input)',
              color: selectedColor === 'ALL' ? 'var(--primary)' : 'var(--text-muted)',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            모든 색상
          </button>
          {COLOR_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onColorChange(chip.key)}
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                backgroundColor: chip.color,
                border: selectedColor === chip.key ? '2px solid var(--text-bright)' : '1px solid var(--border-light)',
                cursor: 'pointer',
                transform: selectedColor === chip.key ? 'scale(1.2)' : 'none',
                padding: 0,
              }}
              title={chip.label}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {filteredCount}/{totalCount}건
        </span>

        <button
          type="button"
          onClick={onNewMemo}
          className="btn btn-primary btn-sm"
          style={{ fontSize: '0.74rem', height: '26px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={13} /> 새 메모 작성
        </button>
      </div>
    </div>
  );
};
