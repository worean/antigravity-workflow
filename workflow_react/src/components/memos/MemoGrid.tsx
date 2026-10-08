import React from 'react';
import { StickyNote, Plus } from 'lucide-react';
import type { MemoDto } from '@/types/memo';
import { MemoCard } from './MemoCard';

export interface MemoGridProps {
  memos: MemoDto[];
  isLoading?: boolean;
  onSelectMemo: (memo: MemoDto) => void;
  onEditMemo?: (memoId: number) => void;
  onDeleteMemo?: (memoId: number) => void;
  onNewMemo?: () => void;
}

export const MemoGrid: React.FC<MemoGridProps> = ({
  memos,
  isLoading,
  onSelectMemo,
  onEditMemo,
  onDeleteMemo,
  onNewMemo,
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              height: '160px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              opacity: 0.5,
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (memos.length === 0) {
    return (
      <div
        style={{
          padding: '60px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px dashed var(--border-light)',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        <StickyNote size={44} style={{ opacity: 0.35, marginBottom: '12px' }} />
        <h3 style={{ fontSize: '1rem', color: 'var(--text-bright)', margin: '0 0 6px 0' }}>
          작성된 메모가 없습니다.
        </h3>
        <p style={{ fontSize: '0.82rem', margin: '0 0 16px 0', maxWidth: '340px', lineHeight: 1.5 }}>
          새 메모를 작성하여 워크스페이스 팀원들과 지식을 공유하거나 나만의 개인 노트를 기록해 보세요.
        </p>
        {onNewMemo && (
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
            }}
          >
            <Plus size={15} />
            첫 메모 작성하기
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}
    >
      {memos.map((memo) => (
        <MemoCard
          key={memo.id}
          memo={memo}
          onClick={onSelectMemo}
          onEdit={onEditMemo}
          onDelete={onDeleteMemo}
        />
      ))}
    </div>
  );
};
