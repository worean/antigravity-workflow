import React from 'react';
import { Search, Plus, Globe, Lock, Layers } from 'lucide-react';
import type { MemoFilterType } from '@/types/memo';

export interface MemoFilterBarProps {
  search: string;
  filter: MemoFilterType;
  onSearchChange: (search: string) => void;
  onFilterChange: (filter: MemoFilterType) => void;
  onNewMemo: () => void;
  totalCount: number;
}

export const MemoFilterBar: React.FC<MemoFilterBarProps> = ({
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onNewMemo,
  totalCount,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        backgroundColor: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid var(--border-light)',
      }}
    >
      {/* 좌측: 검색창 및 필터 탭 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        {/* 검색 인풋 */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            minWidth: '220px',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="제목 또는 내용 검색..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '6px',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
            }}
          />
        </div>

        {/* 필터 탭 */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '6px',
            padding: '3px',
            border: '1px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: filter === 'all' ? 'var(--bg-card)' : 'transparent',
              color: filter === 'all' ? 'var(--text-bright)' : 'var(--text-muted)',
              fontWeight: filter === 'all' ? 600 : 400,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: filter === 'all' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            <Layers size={13} />
            전체
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('public')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: filter === 'public' ? 'var(--bg-card)' : 'transparent',
              color: filter === 'public' ? 'var(--status-done, #22c55e)' : 'var(--text-muted)',
              fontWeight: filter === 'public' ? 600 : 400,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: filter === 'public' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            <Globe size={13} />
            공개 메모
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('my')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: filter === 'my' ? 'var(--bg-card)' : 'transparent',
              color: filter === 'my' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: filter === 'my' ? 600 : 400,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: filter === 'my' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            <Lock size={13} />
            내 메모
          </button>
        </div>

        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          총 {totalCount}개
        </span>
      </div>

      {/* 우측: 새 메모 버튼 */}
      <button
        type="button"
        onClick={onNewMemo}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: 'var(--primary)',
          color: 'var(--text-bright)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Plus size={15} />
        새 메모 작성
      </button>
    </div>
  );
};
