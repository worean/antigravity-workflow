import React from 'react';
import type { UserMemoItem } from '@/types/memo';
import { MemoCard } from './MemoCard';
import { StickyNote, Plus } from 'lucide-react';

export interface MemoGridProps {
  memos: UserMemoItem[];
  onEdit: (memo: UserMemoItem) => void;
  onDelete: (memoId: string) => void;
  onTogglePin: (memoId: string) => void;
  onSelectIssue?: (issueId: number) => void;
  onNewMemo: () => void;
}

export const MemoGrid: React.FC<MemoGridProps> = ({
  memos,
  onEdit,
  onDelete,
  onTogglePin,
  onSelectIssue,
  onNewMemo,
}) => {
  const pinnedMemos = memos.filter((m) => m.isPinned);
  const normalMemos = memos.filter((m) => !m.isPinned);

  if (memos.length === 0) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-sm, 6px)',
          border: '1px dashed var(--border-light, #383838)',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <StickyNote size={40} style={{ opacity: 0.3 }} />
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          작성된 메모가 없습니다
        </div>
        <div style={{ fontSize: '0.78rem', maxWidth: '320px', lineHeight: 1.4 }}>
          기억해야 할 작업 힌트나 개인적인 체크리스트를 포스트잇 메모로 남겨보세요.
        </div>
        <button
          type="button"
          onClick={onNewMemo}
          className="btn btn-primary btn-sm"
          style={{ marginTop: '8px', fontSize: '0.76rem' }}
        >
          <Plus size={12} style={{ marginRight: '4px' }} /> 첫 메모 작성하기
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {pinnedMemos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#eab308', display: 'flex', alignItems: 'center', gap: '4px' }}>
            📌 상단 고정된 메모 ({pinnedMemos.length})
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
              alignItems: 'start',
            }}
          >
            {pinnedMemos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
                onSelectIssue={onSelectIssue}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pinnedMemos.length > 0 && (
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-sub)' }}>
            일반 메모 ({normalMemos.length})
          </div>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
            alignItems: 'start',
          }}
        >
          {normalMemos.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
              onSelectIssue={onSelectIssue}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
